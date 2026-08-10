import { PrismaService } from '@/prisma/prisma.service';
import { StormfinderService } from '@/stormfinder/stormfinder.service';
import { BalanceService } from '@/balance/balance.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BalanceStatusEnums,
  Check,
  CheckModuleEnums,
  CheckProviderEnums,
  CheckStatusEnums,
  Prisma,
} from '@/db';
import { randomUUID } from 'crypto';
import { CheckQueueService } from '@/queue/check/check-queue.service';
import { CheckResponseDto } from './response/check.response';
import { getCheckModuleLabel } from '@/utils/check-module-label';
import { CheckGateway } from './check.gateway';
import { buildSubjectBodyText } from './utils/subject-body-text';
import { toStoredSubjectBody } from './utils/subject-body';
import { getCheckProvider } from './utils/provider-map';
import { CheckBody } from './types';

@Injectable()
export class CheckService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly balanceService: BalanceService,
    private readonly checkGateway: CheckGateway,
  ) {}

  /* === API ENDPOINTS === */
  public async getAllChecks(userId: string) {
    const checks = await this.prismaService.check.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return checks.map((check) => CheckResponseDto.fromCheck(check));
  }

  public async getCheckById(userId: string, checkId: string) {
    const check = await this.prismaService.check.findUnique({
      where: { id: checkId, userId },
    });

    if (!check) {
      throw new NotFoundException('Проверка не найдена');
    }

    return CheckResponseDto.fromCheck(check);
  }

  public async createCheck(
    userId: string,
    module: CheckModuleEnums,
    body: CheckBody,
  ) {
    const check = await this.prismaService.$transaction(async (tx) => {
      const cost = await this.getCheckPrice(module);
      const idempotencyKey = randomUUID();

      await this.balanceService.debit(
        userId,
        cost,
        BalanceStatusEnums.BALANCE_PURCHASE,
        {
          action: `Оплата модуль ${getCheckModuleLabel(module)}`,
        },
        tx,
      );

      const provider = getCheckProvider(module);
      const subjectBody = toStoredSubjectBody(body);

      return tx.check.create({
        data: {
          userId,
          module,
          provider: provider,
          status: CheckStatusEnums.PENDING,
          subjectBody: subjectBody as Prisma.InputJsonValue,
          subjectBodyText: buildSubjectBodyText(module, subjectBody),
          cost,
          idempotencyKey,
        },
      });
    });

    this.publish(check);
    console.log(check);
    return CheckResponseDto.fromCheck(check);
  }

  private publish(check: Check): void {
    if (
      check.status !== CheckStatusEnums.DONE &&
      check.status !== CheckStatusEnums.FAILED
    ) {
      return;
    }

    const response = CheckResponseDto.fromCheck(check);
    this.checkGateway.emitCheckUpdated(check.userId, response);
  }

  private async getCheckPrice(module: CheckModuleEnums): Promise<number> {
    const row = await this.prismaService.checkPrice.findUnique({
      where: { module },
    });

    if (!row) {
      throw new BadRequestException('Цена для данного модуля не настроена');
    }

    return row.price;
  }
}
