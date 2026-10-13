import { randomBytes } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { VendorInvite } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateVendorInviteDto } from './dto/vendor-invite.dto.js';

export type InviteState = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';

const DAY_MS = 24 * 60 * 60 * 1000;

export function inviteState(i: Pick<VendorInvite, 'usedAt' | 'revokedAt' | 'expiresAt'>, now = new Date()): InviteState {
  if (i.usedAt) return 'USED';
  if (i.revokedAt) return 'REVOKED';
  if (i.expiresAt <= now) return 'EXPIRED';
  return 'ACTIVE';
}

/**
 * Invitations privées : l'inscription libre des vendeurs n'existe pas. OBP conclut un partenariat avec la personne,
 * crée une invitation ici, et lui envoie le lien en message direct (WhatsApp…). Le jeton est secret et à usage unique.
 */
@Injectable()
export class VendorInvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createdById: string, dto: CreateVendorInviteDto) {
    const invite = await this.prisma.vendorInvite.create({
      data: {
        token: randomBytes(18).toString('base64url'),
        note: dto.note.trim(),
        phone: dto.phone?.trim() || null,
        type: dto.type ?? null,
        zone: dto.zone?.trim() || null,
        createdById,
        expiresAt: new Date(Date.now() + (dto.validDays ?? 14) * DAY_MS),
      },
    });
    return this.present(invite);
  }

  async list() {
    const invites = await this.prisma.vendorInvite.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { createdBy: { select: { fullName: true } }, usedBy: { select: { fullName: true, phone: true } } },
    });
    return invites.map((i) => ({ ...this.present(i), createdBy: i.createdBy.fullName, usedBy: i.usedBy }));
  }

  async revoke(id: string) {
    const invite = await this.prisma.vendorInvite.findUnique({ where: { id } });
    if (!invite) throw new NotFoundException('Invitation introuvable.');
    if (invite.usedAt) throw new BadRequestException('Cette invitation a déjà été utilisée.');
    const updated = await this.prisma.vendorInvite.update({ where: { id }, data: { revokedAt: invite.revokedAt ?? new Date() } });
    return this.present(updated);
  }

  /** Ce que l'invité peut voir avant d'ouvrir son compte : jamais le mémo interne. */
  async check(token: string) {
    const invite = await this.prisma.vendorInvite.findUnique({ where: { token } });
    if (!invite) return { valid: false as const, reason: 'UNKNOWN' as const };
    const state = inviteState(invite);
    if (state !== 'ACTIVE') return { valid: false as const, reason: state };
    return {
      valid: true as const,
      type: invite.type,
      zone: invite.zone,
      phoneRestricted: !!invite.phone,
      expiresAt: invite.expiresAt,
    };
  }

  /** Vérifie qu'une invitation peut être utilisée par ce numéro ; ne la consomme pas. */
  async assertUsable(token: string, userPhone: string) {
    const invite = await this.prisma.vendorInvite.findUnique({ where: { token } });
    if (!invite) throw new ForbiddenException("Le compte vendeur s'ouvre sur invitation : ce lien n'est pas valide.");
    const state = inviteState(invite);
    if (state === 'USED') throw new ForbiddenException('Cette invitation a déjà été utilisée.');
    if (state === 'REVOKED') throw new ForbiddenException("Cette invitation a été annulée. Contactez OBP Market.");
    if (state === 'EXPIRED') throw new ForbiddenException('Cette invitation a expiré. Demandez-en une nouvelle à OBP Market.');
    if (invite.phone && invite.phone.replace(/\s/g, '') !== userPhone.replace(/\s/g, '')) {
      throw new ForbiddenException("Cette invitation est réservée à un autre numéro de téléphone. Connectez-vous avec le numéro invité.");
    }
    return invite;
  }

  private present(i: VendorInvite) {
    return {
      id: i.id,
      token: i.token,
      note: i.note,
      phone: i.phone,
      type: i.type,
      zone: i.zone,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      usedAt: i.usedAt,
      revokedAt: i.revokedAt,
      state: inviteState(i),
      /** Chemin à ajouter à l'adresse du site pour obtenir le lien à envoyer. */
      path: `/vendeur/invitation/${i.token}`,
    };
  }
}
