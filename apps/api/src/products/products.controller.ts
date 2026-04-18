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
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CreateProductSchema,
  UpdateProductSchema,
  PublishPageSchema,
  ReorderProductMediaSchema,
} from '@krontech/types';

class CreateProductDto extends createZodDto(CreateProductSchema) {}
class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
class ScheduleDto extends createZodDto(PublishPageSchema) {}
class ReorderProductMediaDto extends createZodDto(ReorderProductMediaSchema) {}

const LocaleParamSchema = z.enum(['tr', 'en']);

@SkipThrottle({ auth: true, public: true, form: true })
@ApiTags('products')
@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  @Post('products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a product' })
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.productsService.create(dto, user.id, req.ip ?? 'unknown');
  }

  @Get('products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List products' })
  findAll(@Query() pagination: PaginationDto, @Query('status') status?: string) {
    return this.productsService.findAll({ ...pagination, status });
  }

  @Get('products/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch('products/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.productsService.update(id, dto, user.id, req.ip ?? 'unknown');
  }

  @Delete('products/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    await this.productsService.remove(id, user.id, req.ip ?? 'unknown');
  }

  @Post('products/:id/publish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Publish a product' })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.productsService.publish(id, user.id, req.ip ?? 'unknown', 'MANUAL');
  }

  @Post('products/:id/schedule')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Schedule a product for future publish' })
  schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    if (!dto.scheduledAt) throw new BadRequestException('scheduledAt is required');
    return this.productsService.schedule(id, new Date(dto.scheduledAt), user.id, req.ip ?? 'unknown');
  }

  @Post('products/:id/unpublish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Unpublish a product' })
  unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.productsService.unpublish(id, user.id, req.ip ?? 'unknown');
  }

  @Post('products/:id/cancel-schedule')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cancel scheduled product publish' })
  cancelSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.productsService.cancelSchedule(id, user.id, req.ip ?? 'unknown');
  }

  @Post('products/:id/media/:mediaId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Add media to a product' })
  async addMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    await this.productsService.addMedia(id, mediaId);
    return { success: true };
  }

  @Delete('products/:id/media/:mediaId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove media from a product' })
  async removeMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    await this.productsService.removeMedia(id, mediaId);
  }

  @Post('products/:id/media/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Reorder product media' })
  async reorderMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderProductMediaDto,
  ) {
    await this.productsService.reorderMedia(id, dto);
    return { success: true };
  }

  // ─── Public endpoints ────────────────────────────────────────────────────────

  @SkipThrottle({ auth: true, form: true })
  @Get('public/products/all-slugs')
  @ApiOperation({ summary: 'Get all published product slugs' })
  getAllSlugs() {
    return this.productsService.getAllSlugs();
  }

  @SkipThrottle({ auth: true, form: true })
  @Get('public/products/:locale/:slug')
  @ApiOperation({ summary: 'Get a published product by locale and slug' })
  findPublished(
    @Param('locale') locale: string,
    @Param('slug') slug: string,
  ) {
    const validLocale = LocaleParamSchema.parse(locale);
    return this.productsService.findPublishedBySlug(slug, validLocale);
  }
}
