import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { toDate, toNumber } from "../utils/transform.utils";

export class GetVisitsQuery {
  @ApiPropertyOptional({
    description: "Поиск по UA/referrer/platform",
    example: "Chrome",
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    description: "Фильтр по IP",
    example: "127.0.0.1",
  })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiPropertyOptional({
    description: "От даты (ISO)",
    example: "2025-08-20T00:00:00Z",
  })
  @IsDate()
  @IsOptional()
  @toDate()
  from?: Date;

  @ApiPropertyOptional({
    description: "До даты (ISO)",
    example: "2025-08-28T23:59:59Z",
  })
  @IsDate()
  @IsOptional()
  @toDate()
  to?: Date;

  @ApiPropertyOptional({
    description: "Курсор (ISO-время lastVisit) для следующей страницы",
    example: "2025-08-28T15:45:00Z",
  })
  @IsDate()
  @IsOptional()
  @toDate()
  cursor?: Date;

  @ApiPropertyOptional({
    description: "Размер страницы (1..200)",
    default: 50,
  })
  @IsInt()
  @IsOptional()
  @toNumber()
  @Min(1)
  @Max(200)
  limit?: number;
}
