import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  StormfinderCheckResponse,
  StormfinderCreateCheckResponse,
  StormfinderErrorBody,
} from './stormfinder.types';

@Injectable()
export class StormfinderService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  public constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService
      .getOrThrow<string>('STORMFINDER_BASE_URL')
      .replace(/\/$/, '');
    this.apiKey = this.configService.getOrThrow<string>('STORMFINDER_API_KEY');
  }

  public async createCheck(
    path: string,
    body: unknown,
    idempotencyKey: string,
  ): Promise<StormfinderCreateCheckResponse> {
    console.log(body);
    return this.request<StormfinderCreateCheckResponse>('POST', path, {
      body,
      idempotencyKey,
    });
  }

  public async getCheck(serviceId: string): Promise<StormfinderCheckResponse> {
    return this.request<StormfinderCheckResponse>(
      'GET',
      `/checks/${serviceId}`,
    );
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    options?: {
      body?: unknown;
      idempotencyKey?: string;
    },
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
    };

    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const init: RequestInit = { method, headers };

    if (options?.body) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }

    const url = `${this.baseUrl}${path}`;

    let response: Response;

    try {
      response = await fetch(url, init);
    } catch {
      throw new ServiceUnavailableException(
        'Сервис проверок временно недоступен',
      );
    }

    const text = await response.text();
    const payload = text
      ? (JSON.parse(text) as T & StormfinderErrorBody)
      : null;

    if (!response.ok) {
      throw this.mapError(response.status, payload);
    }

    return payload as T;
  }

  private mapError(
    status: number,
    payload: StormfinderErrorBody | null,
  ): HttpException {
    const detail =
      typeof payload?.detail === 'string'
        ? payload.detail
        : 'stormfinder_error';

    switch (status) {
      case 400:
        return new BadRequestException(detail);
      case 401:
        return new UnauthorizedException(detail);
      case 402:
        return new HttpException(detail, HttpStatus.PAYMENT_REQUIRED);
      case 403:
        return new ForbiddenException(detail);
      case 404:
        return new NotFoundException(detail);
      case 429:
        return new HttpException(detail, HttpStatus.TOO_MANY_REQUESTS);
      default:
        if (status >= 500) {
          return new BadGatewayException(detail);
        }

        return new HttpException(detail, status);
    }
  }
}
