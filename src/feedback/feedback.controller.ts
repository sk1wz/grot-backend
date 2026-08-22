import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Response } from 'express';
import { Auth } from '@/auth/decorators';
import { CreateFeedbackRequestDto, UpdateFeedbackStatusDto } from './dto';
import { FeedbackService } from './feedback.service';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

@Controller('feedback')
export class FeedbackController {
  public constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_SIZE } }),
  )
  public create(
    @Body() dto: CreateFeedbackRequestDto,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
      | undefined,
  ) {
    return this.feedbackService.create(dto, file);
  }

  @Auth('ADMIN')
  @Get('admin')
  public list() {
    return this.feedbackService.list();
  }

  @Auth('ADMIN')
  @Get('admin/:id')
  public get(@Param('id') id: string) {
    return this.feedbackService.get(id);
  }

  @Auth('ADMIN')
  @Patch('admin/:id/status')
  public updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return this.feedbackService.updateStatus(id, dto);
  }

  @Auth('ADMIN')
  @Get('admin/:id/attachment')
  public async downloadAttachment(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const attachment = await this.feedbackService.getAttachment(id);
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
    });
    return new StreamableFile(attachment.data);
  }

  @Auth('ADMIN')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Param('id') id: string): Promise<void> {
    await this.feedbackService.delete(id);
  }
}
