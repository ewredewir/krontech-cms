import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { SeoService } from './seo.service';
import { CacheService } from '../cache/cache.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateSeoMetaSchema } from '@krontech/types';

class UpdateSeoMetaDto extends createZodDto(UpdateSeoMetaSchema) {}

@ApiTags('seo')
@Controller()
export class SeoController {
  constructor(
    private readonly seoService: SeoService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('public/sitemap.xml')
  @ApiOperation({ summary: 'Get XML sitemap (cached 1hr)' })
  async getSitemap(@Res() res: Response) {
    const xml = await this.seoService.getSitemap(this.cacheService);
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  }

  @Put('pages/:id/seo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Upsert SEO meta for a page' })
  upsertPageSeo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSeoMetaDto,
  ) {
    return this.seoService.upsertForPage(id, dto);
  }

  @Put('blog/posts/:id/seo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Upsert SEO meta for a blog post' })
  upsertBlogSeo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSeoMetaDto,
  ) {
    return this.seoService.upsertForBlogPost(id, dto);
  }

  @Put('products/:id/seo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Upsert SEO meta for a product' })
  upsertProductSeo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSeoMetaDto,
  ) {
    return this.seoService.upsertForProduct(id, dto);
  }
}
