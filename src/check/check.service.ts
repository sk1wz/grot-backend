import { PrismaService } from '@/prisma/prisma.service';
import { StormfinderService } from '@/stormfinder/stormfinder.service';
import { StormfinderCheckResponse } from '@/stormfinder/stormfinder.types';
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
  CheckStatusEnums,
  Prisma,
} from '@/db';
import { randomUUID } from 'crypto';
import { STORMFINDER_CHECK_PATHS, CheckBody } from './types';
import { CheckQueueService } from '@/queue/check/check-queue.service';
import { CheckResponseDto } from './response/check.response';
import { getCheckModuleLabel } from '@/utils/check-module-label';
import {
  isActiveCheckStatus,
  mapStormfinderResponseToCheckData,
  mapStormfinderStatus,
  toCheckError,
} from '@/utils/stormfinder-map';
import { CheckGateway } from './check.gateway';

@Injectable()
export class CheckService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly stormfinderService: StormfinderService,
    private readonly checkQueueService: CheckQueueService,
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
    const cost = await this.getCheckPrice(module);
    const idempotencyKey = randomUUID();

    const check = await this.prismaService.$transaction(async (tx) => {
      await this.balanceService.debit(
        userId,
        cost,
        BalanceStatusEnums.BALANCE_PURCHASE,
        {
          action: `Оплата проверки модуль ${getCheckModuleLabel(module)}`,
        },
        tx,
      );

      return tx.check.create({
        data: {
          userId,
          module,
          status: CheckStatusEnums.PENDING,
          subject: body as unknown as Prisma.InputJsonValue,
          cost,
          idempotencyKey,
        },
      });
    });

    try {
      await this.checkQueueService.enqueueSubmit(module, check.id);
    } catch (error) {
      await this.failCheck(check, error);
      throw error;
    }

    return CheckResponseDto.fromCheck(check);
  }
  /* === ======================== === */

  /* ФУНКЦИЯ ДЛЯ ОТПРАВКИ ПРОВЕРКИ В STORMFINDER */
  public async submitFinder(checkId: string): Promise<void> {
    const check = await this.prismaService.check.findUnique({
      where: { id: checkId },
    });

    if (
      !check ||
      check.status !== CheckStatusEnums.PENDING ||
      check.serviceId
    ) {
      return;
    }

    const path =
      STORMFINDER_CHECK_PATHS[
        check.module as keyof typeof STORMFINDER_CHECK_PATHS
      ];

    try {
      const response = await this.stormfinderService.createCheck(
        path,
        check.subject as unknown as CheckBody,
        check.idempotencyKey,
      );

      await this.prismaService.check.update({
        where: { id: check.id },
        data: mapStormfinderResponseToCheckData(response),
      });

      if (isActiveCheckStatus(mapStormfinderStatus(response.status))) {
        await this.checkQueueService.enqueueSync(check.module, check.id);
      }
    } catch (error) {
      await this.failCheck(check, error);
    }
  }

  /* ФУНКЦИЯ ДЛЯ ОПРОСА ПРОВЕРКИ ПРОВЕРКИ В STORMFINDER */
  public async checkFinderById(checkId: string): Promise<void> {
    const check = await this.prismaService.check.findUnique({
      where: { id: checkId },
    });

    if (!check?.serviceId) {
      return;
    }

    if (
      check.status === CheckStatusEnums.DONE ||
      check.status === CheckStatusEnums.FAILED
    ) {
      return;
    }

    try {
      const response = await this.stormfinderService.getCheck(check.serviceId);
      await this.persistFinderResponse(check, response);

      if (isActiveCheckStatus(mapStormfinderStatus(response.status))) {
        await this.checkQueueService.enqueueSync(check.module, check.id);
      }
    } catch {
      await this.checkQueueService.enqueueSync(check.module, check.id);
    }
  }

  /* ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ОШИБКИ ПРОВЕРКИ */
  public async failCheck(check: Check, error: unknown): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      const current = await tx.check.findUnique({
        where: { id: check.id },
      });

      if (!current) {
        return;
      }

      const shouldRefund =
        current.status !== CheckStatusEnums.DONE &&
        current.status !== CheckStatusEnums.FAILED;

      if (shouldRefund) {
        await this.balanceService.credit(
          current.userId,
          current.cost,
          BalanceStatusEnums.BALANCE_REFUND,
          {
            action: `Возврат средств модуль ${getCheckModuleLabel(current.module)}`,
          },
          tx,
        );
      }

      if (current.status === CheckStatusEnums.FAILED) {
        return;
      }

      await tx.check.update({
        where: { id: current.id },
        data: {
          status: CheckStatusEnums.FAILED,
          completedAt: new Date(),
          error: toCheckError(error),
          ...(shouldRefund ? { balanceRefund: true } : {}),
        },
      });
    });
  }

  /* ФУНКЦИЯ */
  private async persistFinderResponse(
    check: Check,
    response: StormfinderCheckResponse,
  ): Promise<void> {
    const status = mapStormfinderStatus(response.status);
    const shouldRefund =
      status === CheckStatusEnums.FAILED &&
      check.status !== CheckStatusEnums.FAILED;
    await this.prismaService.$transaction(async (tx) => {
      if (shouldRefund) {
        await this.balanceService.credit(
          check.userId,
          check.cost,
          BalanceStatusEnums.BALANCE_REFUND,
          {
            action: `Возврат средств модуль ${getCheckModuleLabel(check.module)}`,
          },
          tx,
        );
      }

      await tx.check.update({
        where: { id: check.id },
        data: {
          ...mapStormfinderResponseToCheckData(response),
          ...(shouldRefund ? { balanceRefund: true } : {}),
        },
      });
    });
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
