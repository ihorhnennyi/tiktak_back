import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class CreatePageDto {
  @ApiProperty({ example: "ua" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]{2}(?:-[A-Za-z0-9]+)?$/)
  locale!: string;

  @ApiProperty({ example: "Title" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(10000)
  textBeforeWallet?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(200)
  wallet?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(10000)
  textAfterWallet?: string;
}
