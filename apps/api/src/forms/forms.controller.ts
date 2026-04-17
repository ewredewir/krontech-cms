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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { createZodDto } from 'nestjs-zod';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateFormSchema, UpdateFormSchema, SubmitFormSchema } from '@krontech/types';

class CreateFormDto extends createZodDto(CreateFormSchema) {}
class UpdateFormDto extends createZodDto(UpdateFormSchema) {}
class SubmitFormDto extends createZodDto(SubmitFormSchema) {}

@ApiTags('forms')
@Controller()
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  @Post('forms')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a form definition' })
  createForm(@Body() dto: CreateFormDto) {
    return this.formsService.createForm(dto);
  }

  @Get('forms')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List form definitions' })
  findAllForms() {
    return this.formsService.findAllForms();
  }

  @Get('forms/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get form definition by ID' })
  findOneForm(@Param('id', ParseUUIDPipe) id: string) {
    return this.formsService.findOneForm(id);
  }

  @Patch('forms/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a form definition' })
  updateForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormDto,
  ) {
    return this.formsService.updateForm(id, dto);
  }

  @Delete('forms/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a form definition' })
  async deleteForm(@Param('id', ParseUUIDPipe) id: string) {
    await this.formsService.deleteForm(id);
  }

  @Get('forms/:id/submissions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get submissions for a form' })
  getSubmissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.formsService.getSubmissions(id, pagination);
  }

  // ─── Public endpoints ────────────────────────────────────────────────────────

  @Get('public/forms/:slug')
  @ApiOperation({ summary: 'Get a form definition by slug (for rendering)' })
  getFormBySlug(@Param('slug') slug: string) {
    return this.formsService.findFormBySlug(slug);
  }

  @Post('public/forms/:slug/submit')
  @ApiOperation({ summary: 'Submit a form' })
  async submit(
    @Param('slug') slug: string,
    @Body() dto: SubmitFormDto,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    await this.formsService.submit(slug, dto, ip, userAgent);
    return { success: true };
  }
}
