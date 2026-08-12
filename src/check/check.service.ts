import { PrismaService } from '@/prisma/prisma.service';
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
import { CheckQueueService } from '@/queue/check/check-queue.service';
import { CheckResponseDto } from './response/check.response';
import { getCheckModuleLabel } from '@/utils/check-module-label';
import { CheckGateway } from './check.gateway';
import { buildSubjectBodyText } from './utils/subject-body-text';
import { toStoredSubjectBody } from './utils/subject-body';
import { getCheckProvider } from './utils/provider-map';
import { CheckBody } from './types';
import { CheckProviderRegistry } from './providers/provider.registry';
import { ProviderCheckResult } from './providers/provider.types';

@Injectable()
export class CheckService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly checkQueueService: CheckQueueService,
    private readonly providerRegistry: CheckProviderRegistry,
    private readonly balanceService: BalanceService,
    private readonly checkGateway: CheckGateway,
  ) {}

  public async getAllChecks(userId: string) {
    return this.getChecksByModule(userId);
  }

  public async getChecksByModule(userId: string, module?: CheckModuleEnums) {
    const checks = await this.prismaService.check.findMany({
      where: { userId, ...(module ? { module } : {}) },
      orderBy: { createdAt: 'desc' },
    });

    return checks.map((check) => CheckResponseDto.fromCheck(check));
  }

  public async getCheckById(userId: string, checkId: string) {
    const check = await this.prismaService.check.findUnique({
      where: { id: checkId, userId },
    });

    if (!check) throw new NotFoundException('Проверка не найдена');

    return CheckResponseDto.fromCheck(check);
  }

  public async createCheck(
    userId: string,
    module: CheckModuleEnums,
    body: CheckBody,
  ) {
    const provider = getCheckProvider(module);
    const subjectBody = toStoredSubjectBody(body);

    const check = await this.prismaService.$transaction(async (tx) => {
      const cost = await this.getCheckPrice(module);
      const idempotencyKey = randomUUID();

      await this.balanceService.debit(
        userId,
        cost,
        BalanceStatusEnums.BALANCE_PURCHASE,
        { action: `Оплата модуля ${getCheckModuleLabel(module)}` },
        tx,
      );

      return tx.check.create({
        data: {
          userId,
          module,
          provider,
          status: CheckStatusEnums.PENDING,
          subjectBody: subjectBody as Prisma.InputJsonValue,
          subjectBodyText: buildSubjectBodyText(module, subjectBody),
          cost,
          idempotencyKey,
        },
      });
    });

    try {
      await this.checkQueueService.enqueueSubmit(check.id);
    } catch (error) {
      await this.failCheck(check, error);
      throw error;
    }

    return CheckResponseDto.fromCheck(check);
  }

  public async processSubmit(checkId: string): Promise<void> {
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

    try {
      const response = await this.providerRegistry
        .get(check.provider)
        .submit(check);
      await this.persistProviderResult(check, response);

      if (this.isActive(response.status)) {
        await this.checkQueueService.enqueueSync(check.id);
      }
    } catch (error) {
      await this.failCheck(check, error);
    }
  }

  public async processSync(checkId: string): Promise<void> {
    const check = await this.prismaService.check.findUnique({
      where: { id: checkId },
    });

    if (!check?.serviceId || !this.isActive(check.status)) return;

    try {
      const response = await this.providerRegistry
        .get(check.provider)
        .poll(check);
      await this.persistProviderResult(check, response);

      if (this.isActive(response.status)) {
        await this.checkQueueService.enqueueSync(check.id);
      }
    } catch {
      await this.checkQueueService.enqueueSync(check.id);
    }
  }

  public async failCheck(
    check: Check,
    error: unknown,
    providerResult?: ProviderCheckResult,
  ): Promise<void> {
    const updatedCheck = await this.prismaService.$transaction(async (tx) => {
      const current = await tx.check.findUnique({ where: { id: check.id } });
      if (!current) return null;

      const shouldRefund =
        current.status !== CheckStatusEnums.DONE &&
        current.status !== CheckStatusEnums.FAILED;

      if (shouldRefund) {
        await this.balanceService.credit(
          current.userId,
          current.cost,
          BalanceStatusEnums.BALANCE_REFUND,
          {
            action: `Возврат средств модуля ${getCheckModuleLabel(current.module)}`,
          },
          tx,
        );
      }

      if (current.status === CheckStatusEnums.FAILED) return null;

      return tx.check.update({
        where: { id: current.id },
        data: {
          status: CheckStatusEnums.FAILED,
          completedAt: new Date(),
          ...(providerResult?.serviceId
            ? { serviceId: providerResult.serviceId }
            : {}),
          ...(providerResult?.result ? { result: providerResult.result } : {}),
          error: providerResult?.error ?? this.toCheckError(error),
          ...(shouldRefund ? { balanceRefund: true } : {}),
        },
      });
    });

    if (updatedCheck) this.publish(updatedCheck);
  }

  private async persistProviderResult(
    check: Check,
    response: ProviderCheckResult,
  ): Promise<void> {
    if (response.status === CheckStatusEnums.FAILED) {
      await this.failCheck(
        check,
        response.error ?? new Error('Проверка отклонена провайдером'),
        response,
      );
      return;
    }

    const isTerminal = response.status === CheckStatusEnums.DONE;
    const updatedCheck = await this.prismaService.check.update({
      where: { id: check.id },
      data: {
        serviceId: response.serviceId,
        status: response.status,
        ...(response.result ? { result: response.result } : {}),
        ...(response.error ? { error: response.error } : {}),
        completedAt: isTerminal ? new Date() : null,
      },
    });

    if (isTerminal) this.publish(updatedCheck);
  }

  private isActive(status: CheckStatusEnums): boolean {
    return (
      status === CheckStatusEnums.QUEUED || status === CheckStatusEnums.RUNNING
    );
  }

  private toCheckError(error: unknown): Prisma.InputJsonValue {
    return {
      message: error instanceof Error ? error.message : 'Ошибка проверки',
    };
  }

  private publish(check: Check): void {
    if (
      check.status === CheckStatusEnums.DONE ||
      check.status === CheckStatusEnums.FAILED
    ) {
      this.checkGateway.emitCheckUpdated(
        check.userId,
        CheckResponseDto.fromCheck(check),
      );
    }
  }

  private async getCheckPrice(module: CheckModuleEnums): Promise<number> {
    const row = await this.prismaService.checkPrice.findUnique({
      where: { module },
    });

    if (!row)
      throw new BadRequestException('Цена для данного модуля не настроена');

    return row.price;
  }
}
