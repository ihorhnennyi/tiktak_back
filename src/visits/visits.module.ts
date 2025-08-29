import { AuthModule } from "@/auth/auth.module";
import { AdminGuard } from "@/auth/guards/admin.guard";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EventsGateway } from "./events.gateway";
import { Visit, VisitSchema } from "./schemas/visit.schema";
import { VisitsController } from "./visits.controller";
import { VisitsService } from "./visits.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visit.name, schema: VisitSchema, collection: "visits" },
    ]),
    AuthModule,
  ],
  providers: [VisitsService, EventsGateway, AdminGuard],
  controllers: [VisitsController],
  exports: [VisitsService, EventsGateway],
})
export class VisitsModule {}
