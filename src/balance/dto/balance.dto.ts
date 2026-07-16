import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class UserTransactionsByIdAdminDto {
  @IsUUID()
  id: string;
}

export class AdminBalanceChangeDto {
  @IsUUID()
  userId: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'Сумма должна быть положительным числом (до 2 знаков после запятой)',
    },
  )
  @Min(0.01, { message: 'Сумма должна быть не меньше 0.01' })
  amount: number;
}
