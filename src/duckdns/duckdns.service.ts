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
import { DuckdnsErrorBody, DuckdnsVehicleCheckResponse } from './duckdns.types';

@Injectable()
export class DuckdnsService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  public constructor(configService: ConfigService) {
    this.baseUrl = configService
      .getOrThrow<string>('DUCKDNS_BASE_URL')
      .replace(/\/$/, '');
    this.apiKey = configService.getOrThrow<string>('DUCKDNS_API_KEY');
  }

  public createRegistrationRestrictionsCheck(
    vin: string,
  ): Promise<DuckdnsVehicleCheckResponse> {
    return this.request('POST', '/api/vehicle/check/registration-restrictions', {
      vin,
    });
  }

  public getVehicleCheck(
    requestId: string,
  ): Promise<DuckdnsVehicleCheckResponse> {
    return this.request('GET', `/api/vehicle/check/${encodeURIComponent(requestId)}`);
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'X-Api-Key': this.apiKey,
      Accept: 'application/json',
    };
    const init: RequestInit = { method, headers };

    if (body) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, init);
    } catch {
      throw new ServiceUnavailableException('Сервис проверок временно недоступен');
    }

    const text = await response.text();
    let payload: (T & DuckdnsErrorBody) | null = null;
    if (text) {
      try {
        payload = JSON.parse(text) as T & DuckdnsErrorBody;
      } catch {
        throw new BadGatewayException('DuckDNS вернул некорректный ответ');
      }
    }
    if (!response.ok) throw this.mapError(response.status, payload);
    return payload as T;
  }

  private mapError(status: number, payload: DuckdnsErrorBody | null): HttpException {
    const detail =
      typeof payload?.detail === 'string'
        ? payload.detail
        : typeof payload?.message === 'string'
          ? payload.message
          : 'duckdns_error';
    switch (status) {
      case 400: return new BadRequestException(detail);
      case 401: return new UnauthorizedException(detail);
      case 403: return new ForbiddenException(detail);
      case 404: return new NotFoundException(detail);
      case 429: return new HttpException(detail, HttpStatus.TOO_MANY_REQUESTS);
      default: return status >= 500 ? new BadGatewayException(detail) : new HttpException(detail, status);
    }
  }
}
