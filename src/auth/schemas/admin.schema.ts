import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { HydratedDocument } from "mongoose";

export type AdminDocument = HydratedDocument<Admin>;

@Schema({ timestamps: true })
export class Admin {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ select: false, default: null })
  refreshTokenHash?: string;

  comparePassword?: (plain: string) => Promise<boolean>;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

AdminSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

AdminSchema.pre("save", async function (next) {
  const doc = this as AdminDocument;
  if (!doc.isModified("password")) return next();
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  doc.password = await bcrypt.hash(doc.password, rounds);
  next();
});
