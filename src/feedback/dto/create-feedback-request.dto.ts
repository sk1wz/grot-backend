import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateFeedbackRequestDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  companyName: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;
}
