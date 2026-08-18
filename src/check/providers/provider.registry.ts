import { Injectable, NotFoundException } from '@nestjs/common';
import { CheckProviderEnums } from '@/db';
import { StormfinderCheckHandler } from './stormfinder/stormfinder.check-handler';
import { DuckdnsCheckHandler } from './duckdns/duckdns.check-handler';
import { CheckProviderHandler } from './provider.types';

@Injectable()
export class CheckProviderRegistry {
  private readonly handlers: Map<CheckProviderEnums, CheckProviderHandler>;

  public constructor(
    stormfinderHandler: StormfinderCheckHandler,
    duckdnsHandler: DuckdnsCheckHandler,
  ) {
    this.handlers = new Map<CheckProviderEnums, CheckProviderHandler>([
      [stormfinderHandler.provider, stormfinderHandler],
      [duckdnsHandler.provider, duckdnsHandler],
    ]);
  }

  public get(provider: CheckProviderEnums): CheckProviderHandler {
    const handler = this.handlers.get(provider);

    if (!handler) {
      throw new NotFoundException(`Обработчик провайдера ${provider} не найден`);
    }

    return handler;
  }
}
