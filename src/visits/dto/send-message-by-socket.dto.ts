import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendMessageBySocketDto {
  @ApiProperty() @IsString() @IsNotEmpty() socketId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() message!: string;
  @ApiPropertyOptional({ enum: ["text", "set-block", "block-mode"] })
  @IsString()
  @IsOptional()
  @IsIn(["text", "set-block", "block-mode"])
  type?: "text" | "set-block" | "block-mode";
}
