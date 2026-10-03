import { randomBytes } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService, type AuditActor } from '../audit/audit.service.js';
import { forgetAccount } from '../auth/jwt-auth.guard.js';
import type { CreateStaffDto, UpdateStaffDto } from './dto/admin.dto.js';

/** Rôles gérés dans « Équipe » (les clients ont leur propre liste). */
export const TEAM_ROLES: Role[] = [Role.AGENT, Role.AGENT_MAGASIN, Role.GESTIONNAIRE_PRIX, Role.GESTIONNAIRE_LIQUIDITE, Role.MODERATEUR, Role.ADMIN];
/** Rôles qui se connectent par e-mail et mot de passe (les agents de terrain se connectent par code). */
const PASSWORD_ROLES: Role[] = TEAM_ROLES.filter((r) => r !== Role.AGENT);

const TEAM_SELECT = { id: true, fullName: true, email: true, phone: true, role: true, disabled: true, lastLoginAt: true, createdAt: true } as const;

function temporaryPassword(): string {
  // 12 caractères aléatoires, lisibles ; à changer dès la première connexion.
  return randomBytes(9).toString('base64url');
}

@Injectable()
export class AdminStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.user.findMany({ where: { role: { in: TEAM_ROLES } }, select: TEAM_SELECT, orderBy: [{ role: 'asc' }, { fullName: 'asc' }] });
  }

  /** Crée un compte du personnel. Le mot de passe provisoire n'est renvoyé qu'une fois, à la création. */
  async create(dto: CreateStaffDto, actor: AuditActor) {
    const needsPassword = PASSWORD_ROLES.includes(dto.role);
    if (needsPassword && !dto.email) throw new BadRequestException('Une adresse e-mail est nécessaire pour ce rôle (connexion par e-mail et mot de passe).');

    const password = needsPassword ? (dto.password ?? temporaryPassword()) : undefined;
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        role: dto.role,
        passwordHash: password ? await bcrypt.hash(password, 10) : null,
      },
      select: TEAM_SELECT,
    });
    await this.audit.log(actor, 'Compte du personnel créé', `${user.fullName} (${user.role})`);
    return { user, temporaryPassword: dto.password ? undefined : password };
  }

  async update(id: string, dto: UpdateStaffDto, actor: AuditActor & { userId?: string | null }) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || !TEAM_ROLES.includes(target.role)) throw new NotFoundException('Compte introuvable.');

    if (id === actor.userId && (dto.disabled === true || (dto.role && dto.role !== target.role))) {
      throw new ConflictException('Vous ne pouvez pas désactiver votre propre compte ni changer votre propre rôle.');
    }
    const losesAdmin = target.role === Role.ADMIN && ((dto.role && dto.role !== Role.ADMIN) || dto.disabled === true);
    if (losesAdmin) {
      const otherAdmins = await this.prisma.user.count({ where: { role: Role.ADMIN, disabled: false, id: { not: id } } });
      if (otherAdmins === 0) throw new ConflictException('Il doit rester au moins un administrateur actif.');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName?.trim(),
        phone: dto.phone?.trim(),
        email: dto.email === undefined ? undefined : dto.email.trim().toLowerCase() || null,
        role: dto.role,
        disabled: dto.disabled,
      },
      select: TEAM_SELECT,
    });
    forgetAccount(id);

    const parts: string[] = [];
    if (dto.disabled !== undefined) parts.push(dto.disabled ? 'désactivé' : 'réactivé');
    if (dto.role && dto.role !== target.role) parts.push(`rôle ${target.role} → ${dto.role}`);
    if (dto.fullName || dto.phone || dto.email !== undefined) parts.push('informations modifiées');
    await this.audit.log(actor, 'Compte du personnel modifié', `${target.fullName}`, parts.join(' · '));
    return user;
  }

  async resetPassword(id: string, actor: AuditActor) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || !PASSWORD_ROLES.includes(target.role)) throw new NotFoundException('Ce compte ne se connecte pas par mot de passe.');
    const password = temporaryPassword();
    await this.prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
    await this.audit.log(actor, 'Mot de passe réinitialisé', target.fullName);
    return { temporaryPassword: password };
  }

  agents() {
    return this.prisma.user.findMany({ where: { role: Role.AGENT, disabled: false }, select: { id: true, fullName: true, phone: true, role: true }, orderBy: { fullName: 'asc' } });
  }

  customers(q?: string) {
    const term = q?.trim();
    return this.prisma.user
      .findMany({
        where: {
          role: Role.CLIENT,
          ...(term ? { OR: [{ phone: { contains: term } }, { fullName: { contains: term, mode: 'insensitive' } }] } : {}),
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          disabled: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { orders: true } },
          orders: { where: { status: { in: ['PAYEE', 'RETIREE'] } }, select: { totalAmount: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      })
      .then((rows) =>
        rows.map(({ orders, _count, ...c }) => ({ ...c, ordersCount: _count.orders, totalSpent: orders.reduce((s, o) => s + o.totalAmount, 0) })),
      );
  }

  async setCustomerDisabled(id: string, disabled: boolean, actor: AuditActor) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== Role.CLIENT) throw new NotFoundException('Client introuvable.');
    await this.prisma.user.update({ where: { id }, data: { disabled } });
    forgetAccount(id);
    await this.audit.log(actor, disabled ? 'Client désactivé' : 'Client réactivé', `${user.fullName} (${user.phone})`);
    return { id, disabled };
  }
}
