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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreatePageDto } from "./dto/create-page.dto";
import { LocaleParamDto } from "./dto/locale-param.dto";
import { UpdatePageDto } from "./dto/update-page.dto";
import { SiteContentService } from "./site-content.service";

function ok<T>(data: T) {
  return { success: true, data };
}

/* -------- ADMIN -------- */
@ApiTags("Admin Content")
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller("admin/site-content") // => /api/admin/site-content
export class SiteContentAdminController {
  constructor(private readonly svc: SiteContentService) {}

  @ApiOperation({ summary: "Список локалей" })
  @Get("locales")
  async list() {
    return ok(await this.svc.listLocales());
  }

  @ApiOperation({ summary: "Получить страницу локали (для формы)" })
  @Get(":locale")
  async getOne(@Param() { locale }: LocaleParamDto) {
    return ok(await this.svc.getAdminPage(locale));
  }

  @ApiOperation({ summary: "Создать локаль" })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreatePageDto, @Req() req: Request) {
    const ip = req.socket.remoteAddress ?? "Unknown";
    return ok(await this.svc.createPage({ ...body, ip }));
  }

  @ApiOperation({ summary: "Изменить локаль (partial)" })
  @Patch(":locale")
  async patch(
    @Param() { locale }: LocaleParamDto,
    @Body() body: UpdatePageDto
  ) {
    return ok(await this.svc.updatePage(locale, body));
  }

  @ApiOperation({ summary: "Удалить локаль" })
  @Delete(":locale")
  async remove(@Param() { locale }: LocaleParamDto) {
    return ok(await this.svc.deletePage(locale));
  }
}

/* -------- PUBLIC -------- */
@ApiTags("Public Content")
@Controller("content") // => /api/content
export class SiteContentPublicController {
  constructor(private readonly svc: SiteContentService) {}

  @ApiOperation({ summary: "Публичный список локалей" })
  @Get("locales") // разместить ВЫШЕ, чем :locale
  async listPublic() {
    return ok(await this.svc.listLocales());
  }

  @ApiOperation({ summary: "Публичная страница по локали" })
  @Get(":locale")
  async get(@Param() { locale }: LocaleParamDto) {
    const page = await this.svc.getPublicPage(locale);
    if (!page) return { success: false, error: "Not found" };
    return ok(page);
  }
}
