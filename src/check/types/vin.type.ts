import { Matches, IsNotEmpty, IsString, Length } from 'class-validator';

export class VinSubjectDto {
  @IsString({ message: 'VIN должен быть строкой' })
  @IsNotEmpty({ message: 'VIN обязателен' })
  @Length(17, 17, { message: 'VIN должен содержать 17 символов' })
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, {
    message: 'VIN невалиден: 17 символов, без I, O и Q',
  })
  vin: string;
}
