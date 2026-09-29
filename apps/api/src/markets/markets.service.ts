import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SAFE_USER_SELECT } from '../common/safe-user.select.js';
import type { CreateMarketDto } from './dto/create-market.dto.js';

@Injectable()
export class MarketsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMarketDto) {
    return this.prisma.market.create({ data: dto });
  }

  findAll() {
    return this.prisma.market.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const market = await this.prisma.market.findUnique({ where: { id } });
    if (!market) throw new NotFoundException(`Marché ${id} introuvable`);
    return market;
  }

  /** Agents affectés à un marché (§3, COL-01). */
  findAgents(marketId: string) {
    return this.prisma.marketAssignment.findMany({
      where: { marketId },
      include: { agent: { select: SAFE_USER_SELECT } },
    });
  }

  assignAgent(marketId: string, agentId: string) {
    return this.prisma.marketAssignment.upsert({
      where: { agentId_marketId: { agentId, marketId } },
      create: { agentId, marketId },
      update: {},
    });
  }
}
