import { Injectable, NotFoundException } from '@nestjs/common';
import { FeedbackRequest } from '@/db';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFeedbackRequestDto, UpdateFeedbackStatusDto } from './dto';

type UploadedAttachment = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class FeedbackService {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(
    dto: CreateFeedbackRequestDto,
    attachment?: UploadedAttachment,
  ) {
    const request = await this.prisma.feedbackRequest.create({
      data: {
        ...dto,
        attachmentName: attachment?.originalname,
        attachmentMimeType: attachment?.mimetype,
        attachmentSize: attachment?.size,
        attachmentData: attachment
          ? Uint8Array.from(attachment.buffer)
          : undefined,
      },
    });

    return this.toResponse(request);
  }

  public async list() {
    const requests = await this.prisma.feedbackRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((request) => this.toResponse(request));
  }

  public async get(id: string) {
    return this.toResponse(await this.findById(id));
  }

  public async updateStatus(id: string, dto: UpdateFeedbackStatusDto) {
    await this.findById(id);
    const request = await this.prisma.feedbackRequest.update({
      where: { id },
      data: { status: dto.status },
    });

    return this.toResponse(request);
  }

  public async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.feedbackRequest.delete({ where: { id } });
  }

  public async getAttachment(id: string) {
    const request = await this.findById(id);
    if (!request.attachmentData || !request.attachmentName) {
      throw new NotFoundException('Вложение не найдено');
    }

    return {
      data: request.attachmentData,
      name: request.attachmentName,
      mimeType: request.attachmentMimeType ?? 'application/octet-stream',
    };
  }

  private async findById(id: string): Promise<FeedbackRequest> {
    const request = await this.prisma.feedbackRequest.findUnique({
      where: { id },
    });
    if (!request)
      throw new NotFoundException('Заявка обратной связи не найдена');

    return request;
  }

  private toResponse(request: FeedbackRequest) {
    return {
      id: request.id,
      name: request.name,
      companyName: request.companyName,
      email: request.email,
      phone: request.phone,
      message: request.message,
      status: request.status,
      attachment: request.attachmentName
        ? {
            name: request.attachmentName,
            mimeType: request.attachmentMimeType,
            size: request.attachmentSize,
          }
        : null,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
}
