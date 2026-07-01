import { AuthMethod } from '@/db';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Имя пользователя должно быть строкой.' })
  @IsNotEmpty({ message: 'Имя пользователя обязательно для заполнения.' })
  username: string;

  @IsString({ message: 'Email Должен быть строкой' })
  @IsEmail({}, { message: 'Некорректный формат email.' })
  @IsNotEmpty({ message: 'Email обязателен для заполнения.' })
  email: string;

  @IsString({ message: 'Пароль должен быть строкой.' })
  @IsNotEmpty({ message: 'Пароль обязателен для заполнения.' })
  @MinLength(6, { message: 'Пароль должен содержать не менее 6 символов.' })
  password: string;

  method: AuthMethod;

  picture?: string;
}
