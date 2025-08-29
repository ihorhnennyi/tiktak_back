import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type VisitDocument = HydratedDocument<Visit>;

@Schema({ timestamps: true, versionKey: false })
export class Visit {
  @Prop({ index: true, trim: true }) ip!: string;

  @Prop({ trim: true }) userAgent?: string;
  @Prop({ trim: true }) lang?: string;
  @Prop({ trim: true }) timezone?: string;
  @Prop({ trim: true }) screen?: string;
  @Prop({ trim: true }) platform?: string;
  @Prop({ trim: true }) referrer?: string;

  @Prop({ type: Number }) memory?: number;
  @Prop({ type: Number }) cores?: number;
  @Prop({ type: Boolean }) online?: boolean;
  @Prop({ type: Boolean }) secure?: boolean;

  @Prop({ trim: true }) connectionType?: string;
  @Prop({ type: Number }) maxTouchPoints?: number;
  @Prop({ type: Boolean }) cookieEnabled?: boolean;

  @Prop({ type: Number, default: 1 }) visitsCount!: number;

  @Prop({ index: true }) socketId?: string;
  @Prop({ default: false, index: true }) isBlocked!: boolean;

  @Prop({ trim: true }) cookies?: string;

  @Prop({ default: Date.now, index: true }) lastVisit!: Date;
  @Prop({ trim: true, index: true }) pageId?: string;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);
VisitSchema.index({ lastVisit: -1 });
VisitSchema.index({ ip: 1, socketId: 1 });
VisitSchema.index({ ip: 1, pageId: 1 });
VisitSchema.index({ ip: 1, lastVisit: -1 });
