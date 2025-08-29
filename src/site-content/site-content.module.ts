// src/site-content/site-content.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LocalePage, LocalePageSchema } from "./schemas/locale-page.schema";
import {
  SiteContentAdminController,
  SiteContentPublicController,
} from "./site-content.controller";
import { SiteContentService } from "./site-content.service";

// ВАЖНО: подключаем модуль аутентификации
import { AuthModule } from "@/auth/auth.module";
import { AdminGuard } from "@/auth/guards/admin.guard";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LocalePage.name, schema: LocalePageSchema },
    ]),
    AuthModule, // <-- вот это даёт доступ к AuthService
  ],
  controllers: [SiteContentAdminController, SiteContentPublicController],
  providers: [SiteContentService, AdminGuard], // <-- guard как провайдер
  exports: [SiteContentService],
})
export class SiteContentModule {}
