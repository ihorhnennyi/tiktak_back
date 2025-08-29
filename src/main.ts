// src/main.ts
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import "reflect-metadata";
import { AppModule } from "./app.module";

function parseOrigins() {
  const list = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : [/^http:\/\/localhost:\d+$/];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.enableCors({ origin: parseOrigins(), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Admin API")
      .setDescription("Документация API для админки")
      .setVersion("1.0.0")
      .addBearerAuth()
      .addCookieAuth("aid", { type: "apiKey", in: "cookie" })
      .addServer("http://localhost:" + (process.env.PORT || 8000))
      .build();

    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, doc, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(process.env.PORT || 8000);
}
bootstrap();
