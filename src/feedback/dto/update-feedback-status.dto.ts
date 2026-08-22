import { IsEnum } from 'class-validator';
import { FeedbackStatus } from '@/db';

export class UpdateFeedbackStatusDto {
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
}
