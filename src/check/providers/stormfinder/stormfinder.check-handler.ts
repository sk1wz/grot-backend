import { Injectable } from '@nestjs/common';
import { Check, CheckProviderEnums } from '@/db';
import { StormfinderService } from '@/stormfinder/stormfinder.service';
import { CheckProviderHandler, ProviderCheckResult } from '../provider.types';
import { buildStormfinderRequest } from './stormfinder.request-builder';
import { mapStormfinderResponse } from './stormfinder.response-mapper';

@Injectable()
export class StormfinderCheckHandler implements CheckProviderHandler {
  public readonly provider = CheckProviderEnums.STORMFINDER;

  public constructor(private readonly stormfinderService: StormfinderService) {}

  public async submit(check: Check): Promise<ProviderCheckResult> {
    const request = buildStormfinderRequest(check);
    const response = await this.stormfinderService.createCheck(
      request.path,
      request.body,
      check.idempotencyKey,
    );

    return mapStormfinderResponse(response, check.module);
  }

  public async poll(check: Check): Promise<ProviderCheckResult> {
    if (!check.serviceId) {
      throw new Error('Невозможно опросить провайдера без serviceId');
    }

    const response = await this.stormfinderService.getCheck(check.serviceId);
    return mapStormfinderResponse(response, check.module);
  }
}
