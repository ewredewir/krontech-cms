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
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CreateBlogPostSchema,
  UpdateBlogPostSchema,
  PublishPageSchema,
} from '@krontech/types';

class CreateBlogPostDto extends createZodDto(CreateBlogPostSchema) {}
class UpdateBlogPostDto extends createZodDto(UpdateBlogPostSchema) {}
class ScheduleDto extends createZodDto(PublishPageSchema) {}

const LocaleParamSchema = z.enum(['tr', 'en']);

@SkipThrottle({ auth: true, public: true, form: true })
@ApiTags('blog')
@Controller()
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  @Post('blog/posts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a blog post' })
  create(
    @Body() dto: CreateBlogPostDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.blogService.create(dto, user.id, req.ip ?? 'unknown');
  }

  @Get('blog/posts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List blog posts' })
  findAll(@Query() pagination: PaginationDto, @Query('status') status?: string) {
    return this.blogService.findAll({ ...pagination, status });
  }

  @Get('blog/posts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get blog post by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogService.findOne(id);
  }

  @Patch('blog/posts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a blog post' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlogPostDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.blogService.update(id, dto, user.id, req.ip ?? 'unknown');
  }

  @Delete('blog/posts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a blog post' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    await this.blogService.remove(id, user.id, req.ip ?? 'unknown');
  }

  @Post('blog/posts/:id/publish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Publish a blog post' })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.blogService.publish(id, user.id, req.ip ?? 'unknown', 'MANUAL');
  }

  @Post('blog/posts/:id/schedule')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Schedule a blog post' })
  schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    if (!dto.scheduledAt) throw new BadRequestException('scheduledAt is required');
    return this.blogService.schedule(id, new Date(dto.scheduledAt), user.id, req.ip ?? 'unknown');
  }

  @Post('blog/posts/:id/unpublish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Unpublish a blog post' })
  unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.blogService.unpublish(id, user.id, req.ip ?? 'unknown');
  }

  @Post('blog/posts/:id/cancel-schedule')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cancel scheduled blog post publish' })
  cancelSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.blogService.cancelSchedule(id, user.id, req.ip ?? 'unknown');
  }

  @Get('blog/categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List blog categories' })
  getCategories() {
    return this.blogService.getCategories();
  }

  @Get('blog/tags')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List blog tags' })
  getTags() {
    return this.blogService.getTags();
  }

  // ─── Public endpoints ────────────────────────────────────────────────────────

  @SkipThrottle({ auth: true, form: true })
  @Get('public/blog/posts/all-slugs')
  @ApiOperation({ summary: 'Get all published blog post slugs' })
  getAllSlugs() {
    return this.blogService.getAllSlugs();
  }

  @SkipThrottle({ auth: true, form: true })
  @Get('public/blog/posts/:locale')
  @ApiOperation({ summary: 'Get all published blog posts' })
  findAllPublished(@Param('locale') locale: string) {
    LocaleParamSchema.parse(locale);
    return this.blogService.findAllPublished();
  }

  @SkipThrottle({ auth: true, form: true })
  @Get('public/blog/posts/:locale/:slug')
  @ApiOperation({ summary: 'Get a published blog post by locale and slug' })
  findPublished(
    @Param('locale') locale: string,
    @Param('slug') slug: string,
  ) {
    const validLocale = LocaleParamSchema.parse(locale);
    return this.blogService.findPublishedBySlug(slug, validLocale);
  }
}
