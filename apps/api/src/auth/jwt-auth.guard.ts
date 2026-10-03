import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  /** Nom du compte connecté, pour le journal d'activité. */
  userName?: string;
}

interface CachedAccount {
  disabled: boolean;
  role: string;
  fullName: string;
  at: number;
}

/** Les droits sont relus en base au plus toutes les 30 s : un compte désactivé ou un rôle modifié prend effet vite. */
const ACCOUNT_TTL_MS = 30_000;
const cache = new Map<string, CachedAccount>();

/** À appeler après avoir modifié un compte (désactivation, changement de rôle) pour que cela s'applique tout de suite. */
export function forgetAccount(userId: string): void {
  cache.delete(userId);
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Jeton manquant.');
    }

    let userId: string;
    try {
      userId = (await this.jwt.verifyAsync<{ sub: string }>(header.slice(7))).sub;
    } catch {
      throw new UnauthorizedException('Jeton invalide ou expiré.');
    }

    let account = cache.get(userId);
    if (!account || Date.now() - account.at > ACCOUNT_TTL_MS) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { disabled: true, role: true, fullName: true } });
      if (!user) throw new UnauthorizedException('Compte introuvable.');
      account = { disabled: user.disabled, role: user.role, fullName: user.fullName, at: Date.now() };
      cache.set(userId, account);
    }
    if (account.disabled) throw new UnauthorizedException('Ce compte a été désactivé.');

    req.userId = userId;
    // Le rôle vient de la base, pas du jeton : un changement de rôle s'applique sans attendre l'expiration du jeton.
    req.userRole = account.role;
    req.userName = account.fullName;
    return true;
  }
}
