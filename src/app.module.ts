import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import * as Joi from "joi";

import { AuthModule } from "./auth/auth.module";
import { SiteContentModule } from "./site-content/site-content.module";
import { VisitsModule } from "./visits/visits.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local"],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid("development", "production", "test")
          .default("development"),
        PORT: Joi.number().default(8000),

        MONGODB_URI: Joi.string().uri().required(),

        BCRYPT_SALT_ROUNDS: Joi.number().min(4).max(15).default(12),
        ROOT_ADMIN_EMAIL: Joi.string().email().required(),
        ROOT_ADMIN_PASSWORD: Joi.string().min(6).required(),
        JWT_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
        SESSION_TTL_DAYS: Joi.number().default(7),
        SESSION_COOKIE_NAME: Joi.string().default("aid"),

        CORS_ORIGINS: Joi.string().optional(),
      }),
    }),

    MongooseModule.forRoot(process.env.MONGODB_URI as string),

    ThrottlerModule.forRoot([{ ttl: 60, limit: 60 }]),

    AuthModule,

    VisitsModule,
    SiteContentModule,
  ],
})
export class AppModule {}
