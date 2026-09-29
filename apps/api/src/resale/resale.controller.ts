import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ResaleService } from './resale.service.js';
import { CreateResaleListingDto } from './dto/create-resale-listing.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

@Controller('resale-listings')
@UseGuards(JwtAuthGuard)
export class ResaleController {
  constructor(private readonly resale: ResaleService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateResaleListingDto) {
    return this.resale.create(req.userId!, dto);
  }

  @Get('mine')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.resale.findMine(req.userId!);
  }

  @Post(':id/cancel')
  cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.resale.cancel(req.userId!, id);
  }
}
