import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePageDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  textBeforeWallet?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  wallet?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  textAfterWallet?: string;
}
