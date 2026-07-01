import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class GetUserTransactionsByAdminDto {
  @IsUUID()
  id: string;
}

export class AdminBalanceChangeDto {
  @IsUUID('4')
  userId: string;

  @IsInt()
  @IsPositive()
  amount: number;
}
