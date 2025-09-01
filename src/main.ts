import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import "reflect-metadata";
import { AppModule } from "./app.module";

function parseOrigins(): (string | RegExp)[] {
  const list = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length > 0) return list;

  return [/^http:\/\/localhost:\d+$/];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {});

  app.setGlobalPrefix("api");

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({
    origin: parseOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  const enableSwagger =
    process.env.NODE_ENV !== "production" || process.env.SWAGGER === "true";

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle("Admin API")
      .setDescription("Документация API для админки")
      .setVersion("1.0.0")
      .addBearerAuth()
      .addCookieAuth("aid", { type: "apiKey", in: "cookie" })
      .addServer("/")
      .build();

    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, doc, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 8000;
  await app.listen(port, "0.0.0.0");
  console.log(`API is running on http://0.0.0.0:${port}/api`);
}

bootstrap();
