import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { AuthService } from "./auth.services";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { AdminGuard } from "./guards/admin.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiOperation({ summary: "Логин: возвращает пару токенов" })
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(200)
  @Post("login")
  async login(@Body() { login, password }: LoginDto) {
    const result = await this.auth.validateLogin(login, password);
    if (!result) throw new UnauthorizedException("INVALID_CREDENTIALS");

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @ApiOperation({ summary: "Обновление пары токенов по refreshToken из тела" })
  @HttpCode(200)
  @Post("refresh")
  async refresh(@Body() { refreshToken }: RefreshDto) {
    const result = await this.auth.refreshByToken(refreshToken);
    if (!result) throw new UnauthorizedException("INVALID_REFRESH");
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @ApiOperation({ summary: "Выход (инвалидация сохранённого refresh-хэша)" })
  @HttpCode(200)
  @Post("logout")
  async logout(@Req() req: Request) {
    const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const payload = bearer ? await this.auth.verifyAccess(bearer) : null;
    if (payload?.sub) await this.auth.logout(payload.sub);
    return { ok: true };
  }

  @ApiOperation({ summary: "Текущий пользователь (по access Bearer)" })
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get("me")
  me(@Req() req: Request) {
    // @ts-ignore
    return { user: req.user };
  }
}
