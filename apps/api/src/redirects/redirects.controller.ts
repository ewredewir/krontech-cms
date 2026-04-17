import {
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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { RedirectsService } from './redirects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRedirectSchema, UpdateRedirectSchema } from '@krontech/types';

class CreateRedirectDto extends createZodDto(CreateRedirectSchema) {}
class UpdateRedirectDto extends createZodDto(UpdateRedirectSchema) {}

@ApiTags('redirects')
@Controller()
export class RedirectsController {
  constructor(private readonly redirectsService: RedirectsService) {}

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  @Post('redirects')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a redirect rule' })
  create(@Body() dto: CreateRedirectDto) {
    return this.redirectsService.create(dto);
  }

  @Get('redirects')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List all redirect rules' })
  findAll() {
    return this.redirectsService.findAll();
  }

  @Get('redirects/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get redirect by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.redirectsService.findOne(id);
  }

  @Patch('redirects/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a redirect rule' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRedirectDto,
  ) {
    return this.redirectsService.update(id, dto);
  }

  @Delete('redirects/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a redirect rule' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.redirectsService.remove(id);
  }

  // ─── Public endpoint (Redis-cached, 60s TTL) ────────────────────────────────

  @Get('public/redirects')
  @ApiOperation({ summary: 'Get active redirect rules (Redis-cached, 60s TTL)' })
  getActiveRedirects() {
    return this.redirectsService.getActiveRedirects();
  }
}
