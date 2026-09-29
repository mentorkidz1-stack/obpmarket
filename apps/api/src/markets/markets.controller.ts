import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MarketsService } from './markets.service.js';
import { CreateMarketDto } from './dto/create-market.dto.js';

@Controller('markets')
export class MarketsController {
  constructor(private readonly markets: MarketsService) {}

  @Post()
  create(@Body() dto: CreateMarketDto) {
    return this.markets.create(dto);
  }

  @Get()
  findAll() {
    return this.markets.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.markets.findOne(id);
  }

  @Get(':id/agents')
  findAgents(@Param('id') id: string) {
    return this.markets.findAgents(id);
  }

  @Post(':id/agents/:agentId')
  assignAgent(@Param('id') id: string, @Param('agentId') agentId: string) {
    return this.markets.assignAgent(id, agentId);
  }
}
