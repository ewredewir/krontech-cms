import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { Media } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateMediaDto } from '@krontech/types';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class MediaService {
  private readonly s3: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      },
      forcePathStyle: true,
    });
  }

  async upload(
    file: Express.Multer.File,
    userId: string,
    ipAddress: string,
  ): Promise<Media> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds 50 MB limit');
    }

    let width: number | undefined;
    let height: number | undefined;
    let blurDataUrl: string | undefined;

    if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
      const meta = await sharp(file.buffer).metadata();
      width = meta.width;
      height = meta.height;

      const blurBuffer = await sharp(file.buffer)
        .resize(10, 10, { fit: 'inside' })
        .webp({ quality: 20 })
        .toBuffer();
      blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;
    }

    const s3Key = `uploads/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const publicUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${s3Key}`;

    const media = await this.prisma.media.create({
      data: {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        s3Key,
        publicUrl,
        blurDataUrl,
        altText: { tr: '', en: '' },
        uploadedById: userId,
      },
    });

    await this.auditService.log({
      userId,
      action: 'MEDIA_UPLOADED',
      entityType: 'Media',
      entityId: media.id,
      ipAddress,
    });

    return media;
  }

  async findAll(params: {
    page: number;
    limit: number;
    mimeType?: string;
  }): Promise<{ data: Media[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(params.mimeType ? { mimeType: { startsWith: params.mimeType } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.prisma.media.findFirst({
      where: { id, deletedAt: null },
    });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async update(
    id: string,
    dto: UpdateMediaDto,
    userId: string,
    ipAddress: string,
  ): Promise<Media> {
    await this.findOne(id);
    const updated = await this.prisma.media.update({
      where: { id },
      data: { altText: dto.altText },
    });
    await this.auditService.log({
      userId,
      action: 'MEDIA_UPDATED',
      entityType: 'Media',
      entityId: id,
      diff: dto,
      ipAddress,
    });
    return updated;
  }

  async softDelete(id: string, userId: string, ipAddress: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.auditService.log({
      userId,
      action: 'MEDIA_DELETED',
      entityType: 'Media',
      entityId: id,
      ipAddress,
    });
  }

  async restore(id: string, userId: string, ipAddress: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    if (!media.deletedAt) throw new BadRequestException('Media is not deleted');

    const restored = await this.prisma.media.update({
      where: { id },
      data: { deletedAt: null },
    });
    await this.auditService.log({
      userId,
      action: 'MEDIA_RESTORED',
      entityType: 'Media',
      entityId: id,
      ipAddress,
    });
    return restored;
  }

  async hardDelete(media: Media): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: media.s3Key,
      }),
    );
    await this.prisma.media.delete({ where: { id: media.id } });
  }

  async checkMediaInUse(mediaId: string): Promise<boolean> {
    const [seoCount, productCount, blogCount] = await Promise.all([
      this.prisma.seoMeta.count({ where: { ogImageId: mediaId } }),
      this.prisma.productMedia.count({ where: { mediaId } }),
      this.prisma.blogPost.count({ where: { featuredImageId: mediaId } }),
    ]);
    return seoCount + productCount + blogCount > 0;
  }
}
