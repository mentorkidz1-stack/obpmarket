import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService, type AuditActor } from '../audit/audit.service.js';
import { SAFE_USER_SELECT } from '../common/safe-user.select.js';
import type { CreateMarketDto } from './dto/create-market.dto.js';
import type { UpdateMarketDto } from './dto/update-market.dto.js';

@Injectable()
export class MarketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateMarketDto, actor?: AuditActor) {
    const market = await this.prisma.market.create({ data: dto });
    await this.audit.log(actor ?? null, 'Marché créé', `Marché ${market.name} (${market.city})`);
    return market;
  }

  findAll() {
    return this.prisma.market.findMany({ orderBy: { name: 'asc' } });
  }

  /** Vue du back-office : chaque marché avec ses agents et le nombre de relevés. */
  findAllForAdmin() {
    return this.prisma.market.findMany({
      orderBy: { name: 'asc' },
      include: {
        assignments: { include: { agent: { select: SAFE_USER_SELECT } } },
        _count: { select: { readings: true } },
      },
    });
  }

  /** Marchés où l'agent connecté a le droit de relever les prix. */
  async findAssignedTo(agentId: string) {
    const assignments = await this.prisma.marketAssignment.findMany({
      where: { agentId },
      include: { market: true },
    });
    return assignments.map((a) => a.market).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  async findOne(id: string) {
    const market = await this.prisma.market.findUnique({ where: { id } });
    if (!market) throw new NotFoundException(`Marché ${id} introuvable`);
    return market;
  }

  async update(id: string, dto: UpdateMarketDto, actor: AuditActor) {
    const before = await this.findOne(id);
    const market = await this.prisma.market.update({ where: { id }, data: dto });
    await this.audit.log(actor, 'Marché modifié', `Marché ${before.name}`, Object.keys(dto).join(', '));
    return market;
  }

  async remove(id: string, actor: AuditActor) {
    const market = await this.findOne(id);
    const readings = await this.prisma.priceReading.count({ where: { marketId: id } });
    if (readings > 0) {
      throw new ConflictException(`« ${market.name} » a ${readings} relevé(s) de prix : il ne peut plus être supprimé.`);
    }
    await this.prisma.market.delete({ where: { id } });
    await this.audit.log(actor, 'Marché supprimé', `Marché ${market.name}`);
    return { deleted: true };
  }

  /** Agents affectés à un marché (§3, COL-01). */
  findAgents(marketId: string) {
    return this.prisma.marketAssignment.findMany({
      where: { marketId },
      include: { agent: { select: SAFE_USER_SELECT } },
    });
  }

  async assignAgent(marketId: string, agentId: string, actor?: AuditActor) {
    const [market, agent] = await Promise.all([this.findOne(marketId), this.prisma.user.findUnique({ where: { id: agentId } })]);
    if (!agent || agent.role !== 'AGENT') throw new ConflictException('Seuls les comptes « Agent de terrain » peuvent être affectés à un marché.');
    const assignment = await this.prisma.marketAssignment.upsert({
      where: { agentId_marketId: { agentId, marketId } },
      create: { agentId, marketId },
      update: {},
    });
    await this.audit.log(actor ?? null, 'Agent affecté', `Marché ${market.name}`, agent.fullName);
    return assignment;
  }

  async unassignAgent(marketId: string, agentId: string, actor: AuditActor) {
    const market = await this.findOne(marketId);
    await this.prisma.marketAssignment.deleteMany({ where: { marketId, agentId } });
    await this.audit.log(actor, 'Agent retiré du marché', `Marché ${market.name}`, agentId);
    return { deleted: true };
  }
}
