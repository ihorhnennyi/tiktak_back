import { ApiProperty } from "@nestjs/swagger";

export class AdminDto {
  @ApiProperty({ example: "admin@admin.com" })
  email!: string;

  @ApiProperty({ example: "66b8d9d6f1a2..." })
  id!: string;
}
