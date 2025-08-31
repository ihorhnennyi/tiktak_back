import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class SaveCookiesDto {
  @ApiProperty({ description: "ID сокета, от которого получены cookies" })
  @IsString()
  @IsNotEmpty()
  socketId!: string;

  @ApiProperty({ description: "Cookies в формате строки" })
  @IsString()
  @IsNotEmpty()
  cookies!: string;
}
