import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LocalePage, LocalePageSchema } from "./schemas/locale-page.schema";
import {
  SiteContentAdminController,
  SiteContentPublicController,
} from "./site-content.controller";
import { SiteContentService } from "./site-content.service";

import { AuthModule } from "@/auth/auth.module";
import { AdminGuard } from "@/auth/guards/admin.guard";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LocalePage.name, schema: LocalePageSchema },
    ]),
    AuthModule,
  ],
  controllers: [SiteContentAdminController, SiteContentPublicController],
  providers: [SiteContentService, AdminGuard],
  exports: [SiteContentService],
})
export class SiteContentModule {}
