import { BadRequestException, Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateContactMessageDto } from './dto/create-contact-message.dto.js';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

@Injectable()
export class ContactService {
  /** Limite simple par IP, en mémoire : suffisant contre un envoi répété depuis un même poste. */
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactMessageDto, ip: string) {
    // Un robot a rempli le champ piège : on répond comme si tout allait bien, sans rien enregistrer.
    if (dto.website) return { received: true };

    if (!dto.phone?.trim() && !dto.email?.trim()) {
      throw new BadRequestException('Indiquez un numéro de téléphone ou une adresse e-mail pour que nous puissions vous répondre.');
    }

    const now = Date.now();
    const recent = (this.hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
      throw new HttpException('Trop de messages envoyés. Réessayez dans quelques minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.hits.set(ip, [...recent, now]);

    await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
      },
    });
    return { received: true };
  }

  findAll() {
    return this.prisma.contactMessage.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], take: 200 });
  }

  async setHandled(id: string, handled: boolean) {
    const found = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Message introuvable.');
    return this.prisma.contactMessage.update({
      where: { id },
      data: handled ? { status: 'TRAITE', handledAt: new Date() } : { status: 'NOUVEAU', handledAt: null },
    });
  }
}
