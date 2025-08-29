import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class LocaleParamDto {
  @ApiProperty({ example: "en" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]{2}(?:-[A-Za-z0-9]+)?$/)
  @Transform(({ value }) => String(value).toLowerCase())
  locale!: string;
}
