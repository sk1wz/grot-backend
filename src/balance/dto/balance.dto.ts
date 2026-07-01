import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class UserTransactionsByIdAdminDto {
  @IsUUID()
  id: string;
}

export class AdminBalanceChangeDto {
  @IsUUID()
  userId: string;

  @Type(() => Number)
  @IsInt({ message: 'Сумма должна быть положительным целым числом' })
  @Min(1, { message: 'Сумма должна быть положительным целым числом' })
  amount: number;
}
