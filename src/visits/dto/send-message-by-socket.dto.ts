import { SocketMessageType } from "@/shared/enums/socket-message-type.enum";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendMessageBySocketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  socketId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    enum: SocketMessageType,
    enumName: "SocketMessageType",
  })
  @IsOptional()
  @IsIn(Object.values(SocketMessageType))
  type?: SocketMessageType;
}
