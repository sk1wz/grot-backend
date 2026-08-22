import { Injectable, NotFoundException } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateCheckPriceDto } from './dto/update-check-price.dto';

@Injectable()
export class CheckPriceService {
  public constructor(private readonly prisma: PrismaService) {}

  public async list() {
    return this.prisma.checkPrice.findMany({
      orderBy: { module: 'asc' },
    });
  }

  public async update(module: CheckModuleEnums, dto: UpdateCheckPriceDto) {
    const existing = await this.prisma.checkPrice.findUnique({
      where: { module },
    });
    if (!existing) throw new NotFoundException('Цена для модуля не настроена');

    return this.prisma.checkPrice.update({
      where: { module },
      data: { price: dto.price },
    });
  }
}
