import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Текущий пароль должен быть строкой.' })
  @IsNotEmpty({ message: 'Текущий пароль обязателен.' })
  currentPassword: string;

  @IsString({ message: 'Новый пароль должен быть строкой.' })
  @IsNotEmpty({ message: 'Новый пароль обязателен.' })
  @MinLength(6, {
    message: 'Новый пароль должен содержать не менее 6 символов.',
  })
  newPassword: string;
}
