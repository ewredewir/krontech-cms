import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import multer from 'multer';
import { createZodDto } from 'nestjs-zod';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateMediaSchema } from '@krontech/types';

class UpdateMediaDto extends createZodDto(UpdateMediaSchema) {}

@SkipThrottle({ auth: true, public: true, form: true })
@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a media file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.mediaService.upload(file, user.id, req.ip ?? 'unknown');
  }

  @Get()
  @ApiOperation({ summary: 'List media files' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('mimeType') mimeType?: string,
  ) {
    return this.mediaService.findAll({ ...pagination, mimeType });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a media file by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media alt text' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.mediaService.update(id, dto, user.id, req.ip ?? 'unknown');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a media file' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    await this.mediaService.softDelete(id, user.id, req.ip ?? 'unknown');
    return { success: true };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted media file' })
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.mediaService.restore(id, user.id, req.ip ?? 'unknown');
  }
}
