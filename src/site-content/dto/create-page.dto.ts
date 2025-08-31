import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class PageBlockDto {
  @ApiProperty({ example: "text", enum: ["text", "wallet"] })
  @IsString()
  @IsIn(["text", "wallet"])
  type!: "text" | "wallet";

  @ApiProperty({ example: "Переведите на кошелек ниже" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;
}

export class CreatePageDto {
  @ApiProperty({ example: "ua" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]{2}(?:-[A-Za-z0-9]+)?$/)
  locale!: string;

  @ApiProperty({
    type: [PageBlockDto],
    required: true,
    description: "Массив блоков контента",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageBlockDto)
  blocks!: PageBlockDto[];
}
