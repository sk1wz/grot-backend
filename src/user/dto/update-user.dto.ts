import { IsEmail, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString({ message: 'Имя пользователя должно быть строкой.' })
  username?: string;

  @IsString({ message: 'Email Должен быть строкой' })
  @IsEmail({}, { message: 'Некорректный формат email.' })
  email?: string;

  picture?: string;

  updated_at: Date;
}
