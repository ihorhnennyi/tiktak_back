import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class SaveCookiesDto {
  @ApiProperty() @IsString() @IsNotEmpty() socketId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() cookies!: string;
}
