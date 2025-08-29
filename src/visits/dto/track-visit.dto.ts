import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

const toNumber = () =>
  Transform(({ value }) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  });

const toBoolean = () =>
  Transform(({ value }) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "boolean") return value;
    const v = String(value).toLowerCase().trim();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
    return undefined;
  });

export class TrackVisitDto {
  @ApiPropertyOptional() @IsString() @IsOptional() ip?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() siteId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() origin?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() path?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() sessionId?: string;

  @ApiPropertyOptional() @IsString() @IsOptional() userAgent?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() lang?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() timezone?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() screen?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() platform?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() referrer?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() socketId?: string;

  @ApiPropertyOptional() @IsNumber() @IsOptional() @toNumber() memory?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @toNumber() cores?: number;
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @toNumber()
  maxTouchPoints?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @toBoolean()
  online?: boolean;
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @toBoolean()
  secure?: boolean;
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @toBoolean()
  cookieEnabled?: boolean;

  @ApiPropertyOptional() @IsString() @IsOptional() connectionType?: string;
}
