import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateCheckPriceDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price: number;
}
