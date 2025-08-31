import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class LocaleParamDto {
  @ApiProperty({
    example: "en",
    description:
      "Язык локализации. Например: 'ua', 'en', 'en-US'. Формат — двухбуквенный код ISO 639-1, опционально с регионом.",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]{2}(?:-[A-Za-z0-9]+)?$/, {
    message:
      "Поле locale должно быть в формате: 'xx' или 'xx-XX', где 'xx' — двухбуквенный код языка",
  })
  @Transform(({ value }) => String(value).toLowerCase().trim())
  locale!: string;
}
