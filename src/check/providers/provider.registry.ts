import { Injectable, NotFoundException } from '@nestjs/common';
import { CheckProviderEnums } from '@/db';
import { StormfinderCheckHandler } from './stormfinder/stormfinder.check-handler';
import { CheckProviderHandler } from './provider.types';

@Injectable()
export class CheckProviderRegistry {
  private readonly handlers: Map<CheckProviderEnums, CheckProviderHandler>;

  public constructor(stormfinderHandler: StormfinderCheckHandler) {
    this.handlers = new Map([[stormfinderHandler.provider, stormfinderHandler]]);
  }

  public get(provider: CheckProviderEnums): CheckProviderHandler {
    const handler = this.handlers.get(provider);

    if (!handler) {
      throw new NotFoundException(`Обработчик провайдера ${provider} не найден`);
    }

    return handler;
  }
}
