import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type LocalePageDocument = HydratedDocument<LocalePage>;
export type LocalePageBlockType = "text" | "wallet";

@Schema({ _id: false })
export class LocalePageBlock {
  @Prop({ required: true, enum: ["text", "wallet"] })
  type!: LocalePageBlockType;

  @Prop({ required: true })
  content!: string;
}

export const LocalePageBlockSchema =
  SchemaFactory.createForClass(LocalePageBlock);

@Schema({ timestamps: true, versionKey: false })
export class LocalePage {
  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  locale!: string;

  @Prop({ type: [LocalePageBlockSchema], default: [] })
  blocks!: LocalePageBlock[];

  @Prop()
  ip?: string;
}

export const LocalePageSchema = SchemaFactory.createForClass(LocalePage);
