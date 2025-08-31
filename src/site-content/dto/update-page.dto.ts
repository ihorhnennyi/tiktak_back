import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class PageBlockDto {
  @ApiPropertyOptional({
    description: "Тип блока: текст или кошелёк",
    enum: ["text", "wallet"],
    example: "text",
  })
  @IsOptional()
  @IsString()
  @IsIn(["text", "wallet"])
  type?: "text" | "wallet";

  @ApiPropertyOptional({
    description: "Контент блока (максимум 10 000 символов)",
    example: "Текст или кошелёк",
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;
}

export class UpdatePageDto {
  @ApiPropertyOptional({
    description: "Массив блоков контента",
    type: [PageBlockDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageBlockDto)
  blocks?: PageBlockDto[];
}
