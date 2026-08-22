import { Injectable, NotFoundException } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateCheckPriceDto } from './dto/update-check-price.dto';

@Injectable()
export class CheckPriceService {
  public constructor(private readonly prisma: PrismaService) {}

  public async listForUser(userId: string) {
    const [prices, overrides] = await Promise.all([
      this.prisma.checkPrice.findMany({ orderBy: { module: 'asc' } }),
      this.prisma.userCheckPrice.findMany({ where: { userId } }),
    ]);
    const overrideByModule = new Map(
      overrides.map((override) => [override.module, override.price]),
    );
    return prices.map((price) => ({
      ...price,
      price: overrideByModule.get(price.module) ?? price.price,
    }));
  }

  public async listPersonal(userId: string) {
    await this.ensureUserExists(userId);
    return this.listForUser(userId);
  }

  public async getForUser(userId: string, module: CheckModuleEnums) {
    const [basePrice, override] = await Promise.all([
      this.prisma.checkPrice.findUnique({ where: { module } }),
      this.prisma.userCheckPrice.findUnique({
        where: { userId_module: { userId, module } },
      }),
    ]);
    if (!basePrice)
      throw new NotFoundException('Цена для данного модуля не настроена');
    return override?.price ?? basePrice.price;
  }

  public async setPersonal(
    userId: string,
    module: CheckModuleEnums,
    dto: UpdateCheckPriceDto,
  ) {
    await this.ensureUserExists(userId);
    const basePrice = await this.prisma.checkPrice.findUnique({
      where: { module },
      select: { module: true },
    });
    if (!basePrice)
      throw new NotFoundException('Цена для данного модуля не настроена');
    return this.prisma.userCheckPrice.upsert({
      where: { userId_module: { userId, module } },
      create: { userId, module, price: dto.price },
      update: { price: dto.price },
    });
  }

  public async deletePersonal(userId: string, module: CheckModuleEnums) {
    const result = await this.prisma.userCheckPrice.deleteMany({
      where: { userId, module },
    });
    return { deleted: result.count > 0 };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
  }
}
