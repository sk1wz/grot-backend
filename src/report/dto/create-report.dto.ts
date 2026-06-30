import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  checkId: string;
}
