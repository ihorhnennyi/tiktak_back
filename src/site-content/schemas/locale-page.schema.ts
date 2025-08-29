import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type LocalePageDocument = HydratedDocument<LocalePage>;

@Schema({ timestamps: true, versionKey: false })
export class LocalePage {
  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  locale!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop() textBeforeWallet?: string;
  @Prop({ trim: true }) wallet?: string;
  @Prop() textAfterWallet?: string;

  @Prop() ip?: string;
}

export const LocalePageSchema = SchemaFactory.createForClass(LocalePage);
