import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateInquiryDto, CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto.js';

const M2_PER_UNIT = { M2: 1, ARE: 100, HECTARE: 10_000 } as const;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_INQUIRIES_PER_WINDOW = 5;

@Injectable()
export class PropertiesService {
  /** Limite simple par IP, en mémoire. */
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly prisma: PrismaService) {}

  // ---- Public ----

  findPublished() {
    return this.prisma.property.findMany({
      where: { published: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findPublishedOne(id: string) {
    const property = await this.prisma.property.findFirst({ where: { id, published: true } });
    if (!property) throw new NotFoundException('Bien introuvable.');
    return property;
  }

  async createInquiry(propertyId: string, dto: CreateInquiryDto, ip: string) {
    // Un robot a rempli le champ piège : on répond comme si tout allait bien, sans rien enregistrer.
    if (dto.website) return { received: true };

    await this.findPublishedOne(propertyId);

    const now = Date.now();
    const recent = (this.hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_INQUIRIES_PER_WINDOW) {
      throw new HttpException('Trop de demandes envoyées. Réessayez dans quelques minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.hits.set(ip, [...recent, now]);

    await this.prisma.propertyInquiry.create({
      data: {
        propertyId,
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim() || null,
        message: dto.message?.trim() || null,
      },
    });
    return { received: true };
  }

  // ---- Back-office ----

  findAll() {
    return this.prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { inquiries: { where: { status: 'NOUVEAU' } } } } },
    });
  }

  create(dto: CreatePropertyDto) {
    this.assertRent(dto.kind, dto.rentPeriod);
    const { photos, ...rest } = dto;
    return this.prisma.property.create({
      data: {
        ...rest,
        rentPeriod: dto.kind === 'LOCATION' ? dto.rentPeriod : null,
        areaM2: this.toM2(dto.areaValue, dto.areaUnit),
        photos: JSON.stringify(photos ?? []),
      },
    });
  }

  async update(id: string, dto: UpdatePropertyDto) {
    const current = await this.prisma.property.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Bien introuvable.');

    const kind = dto.kind ?? current.kind;
    const rentPeriod = dto.rentPeriod ?? current.rentPeriod ?? undefined;
    this.assertRent(kind, rentPeriod);

    const { photos, ...rest } = dto;
    const areaTouched = dto.areaValue !== undefined || dto.areaUnit !== undefined;

    return this.prisma.property.update({
      where: { id },
      data: {
        ...rest,
        ...(photos !== undefined ? { photos: JSON.stringify(photos) } : {}),
        ...(dto.kind !== undefined || dto.rentPeriod !== undefined
          ? { rentPeriod: kind === 'LOCATION' ? rentPeriod : null }
          : {}),
        ...(areaTouched ? { areaM2: this.toM2(dto.areaValue ?? current.areaValue ?? undefined, dto.areaUnit ?? current.areaUnit) } : {}),
      },
    });
  }

  async remove(id: string) {
    const found = await this.prisma.property.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Bien introuvable.');
    await this.prisma.property.delete({ where: { id } });
    return { deleted: true };
  }

  findInquiries() {
    return this.prisma.propertyInquiry.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: { property: { select: { id: true, title: true, city: true } } },
    });
  }

  async setInquiryHandled(id: string, handled: boolean) {
    const found = await this.prisma.propertyInquiry.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Demande introuvable.');
    return this.prisma.propertyInquiry.update({
      where: { id },
      data: handled ? { status: 'TRAITE', handledAt: new Date() } : { status: 'NOUVEAU', handledAt: null },
    });
  }

  private assertRent(kind: string, rentPeriod?: string) {
    if (kind === 'LOCATION' && !rentPeriod) {
      throw new BadRequestException('Précisez la période du loyer (par nuit, par mois ou par an).');
    }
  }

  private toM2(value?: number, unit: keyof typeof M2_PER_UNIT = 'M2') {
    return value == null ? null : Math.round(value * M2_PER_UNIT[unit] * 100) / 100;
  }
}
