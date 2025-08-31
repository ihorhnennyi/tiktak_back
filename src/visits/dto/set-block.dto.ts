import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
} from "class-validator";

export class SetBlockBySocketDto {
  @ApiProperty() @IsString() @IsNotEmpty() socketId!: string;
  @ApiProperty({ description: "true = заблокировать, false = снять блок" })
  @IsBoolean()
  isBlocked!: boolean;
}

export class SetBlockByIpDto {
  @ApiProperty() @IsString() @IsNotEmpty() ip!: string;
  @ApiProperty({ description: "true = заблокировать, false = снять блок" })
  @IsBoolean()
  isBlocked!: boolean;
}

export class SetBlockBySocketIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  socketIds!: string[];
  @ApiProperty({ description: "true = заблокировать, false = снять блок" })
  @IsBoolean()
  isBlocked!: boolean;
}

export class SetBlockByIpsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  ips!: string[];
  @ApiProperty({ description: "true = заблокировать, false = снять блок" })
  @IsBoolean()
  isBlocked!: boolean;
}
