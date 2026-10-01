import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RequestOtpDto } from './dto/request-otp.dto.js';
import type { VerifyOtpDto } from './dto/verify-otp.dto.js';
import type { StaffLoginDto } from './dto/staff-login.dto.js';

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES ?? 5);
/// Indépendant de NODE_ENV : tant qu'aucune passerelle SMS réelle n'est branchée
/// (docs/decisions/0002-otp-dev-mode.md), le code doit rester visible même en
/// production déployée, sinon personne ne peut se connecter. Mettre OTP_DEV_MODE=false
/// uniquement une fois une vraie passerelle SMS intégrée.
const otpDevMode = process.env.OTP_DEV_MODE !== 'false';

/** Ne jamais renvoyer le hash du mot de passe au client, même pour les comptes de démo. */
function sanitizeUser<T extends { passwordHash: string | null }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * CPT-01 : envoie un code à usage unique par SMS. Aucune passerelle SMS n'est
   * encore branchée (docs/decisions/0002-otp-dev-mode.md) : en développement,
   * le code est renvoyé directement dans la réponse au lieu d'être envoyé.
   */
  async requestOtp(dto: RequestOtpDto) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.otpCode.create({ data: { phone: dto.phone, code, expiresAt } });

    return {
      sent: true,
      expiresInMinutes: OTP_TTL_MINUTES,
      devCode: otpDevMode ? code : undefined,
    };
  }

  /** Valide le code, crée le compte client au premier passage (CPT-01), délivre un jeton. */
  async verifyOtp(dto: VerifyOtpDto) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone: dto.phone, code: dto.code, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new UnauthorizedException('Code invalide ou expiré.');

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      create: { phone: dto.phone, fullName: 'Nouveau client' },
      update: {},
    });

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: sanitizeUser(user) };
  }

  /** Connexion des rôles internes — docs/decisions/0006-connexion-interne.md. */
  async staffLogin(dto: StaffLoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) throw new UnauthorizedException('Identifiants invalides.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Identifiants invalides.');

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: sanitizeUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return sanitizeUser(user);
  }
}
