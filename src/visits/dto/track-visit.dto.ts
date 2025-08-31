import { toBoolean, toNumber } from "@/visits/utils/transform.utils";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class TrackVisitDto {
  @ApiPropertyOptional() @IsString() @IsOptional() ip?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() siteId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() origin?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() path?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() sessionId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() mac?: string;

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

  @ApiPropertyOptional() @IsString() @IsOptional() country?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() region?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() city?: string;
}
