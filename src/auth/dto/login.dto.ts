import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@admin.com" })
  @IsEmail()
  login!: string;

  @ApiProperty({ example: "admin123", minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
