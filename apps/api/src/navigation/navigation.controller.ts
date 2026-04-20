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
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NavigationService, NavItemDto } from './navigation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@SkipThrottle({ auth: true, public: true, form: true })
@ApiTags('navigation')
@Controller()
export class NavigationController {
  constructor(private readonly navService: NavigationService) {}

  // ─── Public ──────────────────────────────────────────────────────────────────

  @SkipThrottle({ auth: true, form: true })
  @Get('public/navigation/:locale')
  @ApiOperation({ summary: 'Get active navigation tree for a locale' })
  findPublic(@Param('locale') locale: string) {
    return this.navService.findPublic(locale);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────────

  @Get('navigation')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List all navigation items' })
  findAll() {
    return this.navService.findAll();
  }

  @Post('navigation')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a navigation item' })
  create(@Body() dto: NavItemDto) {
    return this.navService.create(dto);
  }

  @Patch('navigation/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a navigation item' })
  update(@Param('id') id: string, @Body() dto: Partial<NavItemDto>) {
    return this.navService.update(id, dto);
  }

  @Delete('navigation/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a navigation item (also deletes its children)' })
  async remove(@Param('id') id: string) {
    await this.navService.remove(id);
  }
}
