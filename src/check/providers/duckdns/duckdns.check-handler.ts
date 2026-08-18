import { Injectable } from '@nestjs/common';
import { Check, CheckProviderEnums } from '@/db';
import { DuckdnsService } from '@/duckdns/duckdns.service';
import { CheckProviderHandler, ProviderCheckResult } from '../provider.types';
import { mapDuckdnsLimitationResponse } from './duckdns.response-mapper';

@Injectable()
export class DuckdnsCheckHandler implements CheckProviderHandler {
  public readonly provider = CheckProviderEnums.DUCKDNS;

  public constructor(private readonly duckdnsService: DuckdnsService) {}

  public async submit(check: Check): Promise<ProviderCheckResult> {
    const vin = this.getVin(check);
    const response = await this.duckdnsService.createRegistrationRestrictionsCheck(vin);
    return mapDuckdnsLimitationResponse(response, vin);
  }

  public async poll(check: Check): Promise<ProviderCheckResult> {
    if (!check.serviceId) throw new Error('Невозможно опросить провайдера без serviceId');
    const response = await this.duckdnsService.getVehicleCheck(check.serviceId);
    return mapDuckdnsLimitationResponse(response, this.getVin(check));
  }

  private getVin(check: Check): string {
    const vin = (check.subjectBody as Record<string, unknown>).vin;
    if (typeof vin !== 'string') throw new Error('VIN отсутствует в данных проверки');
    return vin;
  }
}
