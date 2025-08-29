import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class RefreshDto {
  @ApiProperty({ description: "Refresh JWT" })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
