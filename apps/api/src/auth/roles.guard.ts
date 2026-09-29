import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator.js';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

/** Suppose que JwtAuthGuard s'est déjà exécuté et a rempli req.userRole. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!required.includes(req.userRole as Role)) {
      throw new ForbiddenException("Votre compte n'a pas les droits nécessaires pour cette action.");
    }
    return true;
  }
}
