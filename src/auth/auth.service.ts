import { Request, Response } from 'express';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@/user/user.service';
import { AuthMethod, User } from '@/db';
import { LoginDto, RegisterDto } from './dto';
import { verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { UserResponse } from '@/user/response/user.response';

@Injectable()
export class AuthService {
  public constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}
  public async register(req: Request, dto: RegisterDto) {
    const isExists = await this.userService.findByEmail(dto.email);
    if (isExists) {
      throw new ConflictException(
        'Пользователь с таким email уже зарегистрирован.',
      );
    }
    const newUser = await this.userService.create(
      dto.email,
      dto.password,
      '',
      AuthMethod.CREDENTIALS,
    );
    return this.saveSession(req, newUser, 'Вы успешно зарегистрировались');
  }

  public async login(req: Request, dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Неверный логин или пароль, попробуйте еще раз',
      );
    }
    const isValidPassword = await verify(user.password, dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException(
        'Неверный логин или пароль, попробуйте еще раз',
      );
    }
    return this.saveSession(req, user, 'Вы успешно авторизовались');
  }

  public async logout(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException(
              'Не удалось завершить сессия. Возможно возникла проблема с сервером или она уже была завершена.',
            ),
          );
        }
        res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'));
      });
      resolve();
    });
  }

  private async saveSession(req: Request, user: User, message: string) {
    return new Promise((resolve, reject) => {
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.save((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException('Не удалось сохранить сессию'),
          );
        }
        resolve({
          user: UserResponse.fromUser(user),
          message,
        });
      });
    });
  }
}
