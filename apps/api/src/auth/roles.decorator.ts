import { SetMetadata } from '@nestjs/common';
import type { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** À utiliser avec RolesGuard, après JwtAuthGuard : @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN) */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
