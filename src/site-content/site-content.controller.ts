import { AdminGuard } from "@/auth/guards/admin.guard";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { CreatePageDto } from "./dto/create-page.dto";
import { LocaleParamDto } from "./dto/locale-param.dto";
import { PageBlockDto, UpdatePageDto } from "./dto/update-page.dto";
import { SiteContentService } from "./site-content.service";

function ok<T>(data: T) {
  return { success: true, data };
}

@ApiTags("Admin Content")
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller("admin/site-content")
export class SiteContentAdminController {
  constructor(private readonly svc: SiteContentService) {}

  @Get("locales")
  @ApiOperation({ summary: "Список всех локалей" })
  @ApiResponse({
    status: 200,
    description: "Успешный ответ с массивом локалей",
  })
  async listLocales() {
    return ok(await this.svc.listLocales());
  }

  @Get(":locale")
  @ApiOperation({ summary: "Получить страницу локали (для админки)" })
  @ApiResponse({ status: 200, description: "Успешный ответ со страницей" })
  async getAdminPage(@Param() { locale }: LocaleParamDto) {
    return ok(await this.svc.getAdminPage(locale));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Создать новую локаль" })
  @ApiResponse({ status: 201, description: "Локаль создана" })
  async createPage(@Body() dto: CreatePageDto, @Req() req: Request) {
    const ip = req.socket.remoteAddress ?? "Unknown";
    return ok(await this.svc.createPage(dto.locale, dto.blocks, ip));
  }

  @Patch(":locale")
  @ApiOperation({ summary: "Обновить массив блоков контента локали" })
  @ApiResponse({ status: 200, description: "Контент успешно обновлён" })
  async updateBlocks(
    @Param() { locale }: LocaleParamDto,
    @Body() { blocks }: UpdatePageDto
  ) {
    const validBlocks = (blocks ?? [])
      .filter((b): b is Required<PageBlockDto> => !!b.type && !!b.content)
      .map((b) => ({
        type: b.type,
        content: b.content,
      }));

    return ok(await this.svc.updatePage(locale, validBlocks));
  }

  @Delete(":locale")
  @ApiOperation({ summary: "Удалить локаль" })
  @ApiResponse({ status: 200, description: "Локаль успешно удалена" })
  async deletePage(@Param() { locale }: LocaleParamDto) {
    return ok(await this.svc.deletePage(locale));
  }
}

@ApiTags("Public Content")
@Controller("content")
export class SiteContentPublicController {
  constructor(private readonly svc: SiteContentService) {}

  @Get("locales")
  @ApiOperation({ summary: "Публичный список локалей" })
  @ApiResponse({
    status: 200,
    description: "Успешный ответ с массивом локалей",
  })
  async getPublicLocales() {
    return ok(await this.svc.listLocales());
  }

  @Get(":locale")
  @ApiOperation({ summary: "Публичная страница по локали" })
  @ApiResponse({ status: 200, description: "Успешный ответ со страницей" })
  @ApiResponse({ status: 404, description: "Страница не найдена" })
  async getPublicPage(@Param() { locale }: LocaleParamDto) {
    const page = await this.svc.getPublicPage(locale);
    if (!page) {
      return { success: false, error: "Not found" };
    }
    return ok(page);
  }
}
