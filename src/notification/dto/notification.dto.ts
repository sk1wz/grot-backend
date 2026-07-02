import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(5000)
  message: string;
}

export class MakeReadNotificationDto {
  @IsUUID()
  id: string;
}
