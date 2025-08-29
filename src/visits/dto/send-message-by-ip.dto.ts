import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendMessageByIpDto {
  @ApiProperty() @IsString() @IsNotEmpty() ip!: string;
  @ApiProperty() @IsString() @IsNotEmpty() message!: string;
  @ApiPropertyOptional({ enum: ["text", "set-block", "block-mode"] })
  @IsString()
  @IsOptional()
  @IsIn(["text", "set-block", "block-mode"])
  type?: "text" | "set-block" | "block-mode";
}
