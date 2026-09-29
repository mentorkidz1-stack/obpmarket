import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateBannerDto } from './dto/create-banner.dto.js';
import type { UpdateBannerDto } from './dto/update-banner.dto.js';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Affichées sur l'accueil — actives uniquement, dans l'ordre choisi au back-office. */
  findActive() {
    return this.prisma.banner.findMany({ where: { active: true }, orderBy: { position: 'asc' } });
  }

  findAll() {
    return this.prisma.banner.findMany({ orderBy: { position: 'asc' } });
  }

  create(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.findOneOrThrow(id);
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.prisma.banner.delete({ where: { id } });
    return { deleted: true };
  }

  private async findOneOrThrow(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Bannière introuvable.');
    return banner;
  }
}
