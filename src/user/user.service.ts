import { PrismaService } from '@/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthMethod } from '@/db';
import { hash } from 'argon2';
@Injectable()
export class UserService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async getMe(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Вы не авторизованы.');
    }

    return user;
  }
  public async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден.');
    }

    return user;
  }

  public async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  }

  public async findUsers() {
    const users = await this.prismaService.user.findMany();

    return users;
  }

  public async create(
    email: string,
    password: string,
    picture: string,
    method: AuthMethod,
  ) {
    const user = await this.prismaService.user.create({
      data: {
        email,
        password: password ? await hash(password) : '',
        picture,
        method,
      },
    });

    return user;
  }
}
