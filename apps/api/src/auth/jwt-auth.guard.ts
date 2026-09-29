import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Jeton manquant.');
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; role: string }>(header.slice(7));
      req.userId = payload.sub;
      req.userRole = payload.role;
      return true;
    } catch {
      throw new UnauthorizedException('Jeton invalide ou expiré.');
    }
  }
}
