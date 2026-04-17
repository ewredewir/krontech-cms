import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CreatePageSchema,
  UpdatePageSchema,
  PublishPageSchema,
  CreatePageComponentSchema,
  UpdatePageComponentSchema,
  ReorderComponentsSchema,
} from '@krontech/types';

class CreatePageDto extends createZodDto(CreatePageSchema) {}
class UpdatePageDto extends createZodDto(UpdatePageSchema) {}
class PublishPageDto extends createZodDto(PublishPageSchema) {}
class CreatePageComponentDto extends createZodDto(CreatePageComponentSchema) {}
class UpdatePageComponentDto extends createZodDto(UpdatePageComponentSchema) {}
class ReorderComponentsDto extends createZodDto(ReorderComponentsSchema) {}

const LocaleParamSchema = z.enum(['tr', 'en']);

@ApiTags('pages')
@Controller()
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  @Post('pages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a page' })
  create(
    @Body() dto: CreatePageDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.pagesService.create(dto, user.id, req.ip ?? 'unknown');
  }

  @Get('pages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List pages' })
  findAll(@Query() pagination: PaginationDto, @Query('status') status?: string) {
    return this.pagesService.findAll({ ...pagination, status });
  }

  @Get('pages/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get page by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.findOne(id);
  }

  @Patch('pages/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a page' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.pagesService.update(id, dto, user.id, req.ip ?? 'unknown');
  }

  @Delete('pages/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a page' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    await this.pagesService.remove(id, user.id, req.ip ?? 'unknown');
  }

  @Post('pages/:id/publish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Publish a page' })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.pagesService.publish(id, user.id, req.ip ?? 'unknown', 'MANUAL');
  }

  @Post('pages/:id/schedule')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Schedule a page for future publish' })
  schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishPageDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    if (!dto.scheduledAt) {
      throw new BadRequestException('scheduledAt is required');
    }
    return this.pagesService.schedule(id, new Date(dto.scheduledAt), user.id, req.ip ?? 'unknown');
  }

  @Post('pages/:id/unpublish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Unpublish a page' })
  unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.pagesService.unpublish(id, user.id, req.ip ?? 'unknown');
  }

  @Post('pages/:id/cancel-schedule')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cancel scheduled publish' })
  cancelSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.pagesService.cancelSchedule(id, user.id, req.ip ?? 'unknown');
  }

  @Get('pages/:id/preview-link')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Generate a 1-hour preview link' })
  previewLink(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.generatePreviewLink(id);
  }

  @Get('pages/:id/versions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List page publish versions (last 5)' })
  versions(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagesService.getVersions(id);
  }

  // Components
  @Post('pages/components')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Add a component to a page' })
  addComponent(@Body() dto: CreatePageComponentDto) {
    return this.pagesService.addComponent(dto);
  }

  @Patch('pages/components/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a page component' })
  updateComponent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePageComponentDto,
  ) {
    return this.pagesService.updateComponent(id, dto);
  }

  @Delete('pages/components/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a page component' })
  async removeComponent(@Param('id', ParseUUIDPipe) id: string) {
    await this.pagesService.removeComponent(id);
  }

  @Post('pages/components/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Reorder page components' })
  async reorderComponents(@Body() dto: ReorderComponentsDto) {
    await this.pagesService.reorderComponents(dto);
    return { success: true };
  }

  // ─── Public endpoints ────────────────────────────────────────────────────────

  @Get('public/pages/all-slugs')
  @ApiOperation({ summary: 'Get all published page slugs (for Next.js generateStaticParams)' })
  getAllSlugs() {
    return this.pagesService.getAllSlugs();
  }

  @Get('public/pages/:locale/:slug')
  @ApiOperation({ summary: 'Get a published page by locale and slug' })
  findPublished(
    @Param('locale') locale: string,
    @Param('slug') slug: string,
  ) {
    const validLocale = LocaleParamSchema.parse(locale);
    return this.pagesService.findPublishedBySlug(slug, validLocale);
  }
}
