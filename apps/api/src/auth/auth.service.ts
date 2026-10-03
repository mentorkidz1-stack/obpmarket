import { randomInt } from 'node:crypto';
import { ForbiddenException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsAppService } from '../notifications/whatsapp.service.js';
import { SlidingLimiter } from './otp-limiter.js';
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

const TEN_MINUTES = 10 * 60 * 1000;
/** Seuls ces rôles peuvent se connecter par code reçu sur leur téléphone. */
const OTP_LOGIN_ROLES: string[] = ['CLIENT', 'AGENT'];

@Injectable()
export class AuthService {
  /** 3 codes demandés par numéro et par fenêtre de 10 min ; 10 par adresse IP. */
  private readonly requestsPerPhone = new SlidingLimiter(3, TEN_MINUTES, 'Trop de codes demandés. Réessayez dans quelques minutes.');
  private readonly requestsPerIp = new SlidingLimiter(10, TEN_MINUTES, 'Trop de demandes depuis cet appareil. Réessayez dans quelques minutes.');
  /** 5 codes erronés par numéro et par fenêtre de 10 min, puis blocage temporaire. */
  private readonly failedAttempts = new SlidingLimiter(5, TEN_MINUTES, 'Trop de tentatives. Demandez un nouveau code dans quelques minutes.');
  /** 5 mots de passe erronés par e-mail et par appareil, puis blocage temporaire. */
  private readonly staffFailures = new SlidingLimiter(5, TEN_MINUTES, 'Trop de tentatives. Réessayez dans quelques minutes.');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  /**
   * CPT-01 : envoie un code à usage unique. Par WhatsApp dès que le canal est configuré
   * (docs/decisions/0014-notifications.md) ; en mode démonstration (OTP_DEV_MODE), le code est
   * aussi renvoyé dans la réponse. En production réelle, mettre OTP_DEV_MODE=false.
   */
  async requestOtp(dto: RequestOtpDto, ip = 'inconnu') {
    this.requestsPerIp.hit(ip);
    this.requestsPerPhone.hit(dto.phone);

    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.otpCode.create({ data: { phone: dto.phone, code, expiresAt } });

    let delivered = false;
    if (this.whatsapp.isConfigured()) {
      delivered = await this.whatsapp.sendOtp(dto.phone, code);
      if (!delivered && !otpDevMode) {
        throw new ServiceUnavailableException("Impossible d'envoyer le code pour le moment. Réessayez dans un instant.");
      }
    } else if (!otpDevMode) {
      // Aucun canal d'envoi et pas de mode démonstration : le code ne pourrait jamais arriver.
      throw new ServiceUnavailableException("L'envoi du code n'est pas encore disponible.");
    }

    return {
      sent: true,
      delivered,
      expiresInMinutes: OTP_TTL_MINUTES,
      devCode: otpDevMode ? code : undefined,
    };
  }

  /** Valide le code, crée le compte client au premier passage (CPT-01), délivre un jeton. */
  async verifyOtp(dto: VerifyOtpDto) {
    this.failedAttempts.assertBelow(dto.phone);

    const otp = await this.prisma.otpCode.findFirst({
      where: { phone: dto.phone, code: dto.code, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) {
      this.failedAttempts.hit(dto.phone);
      throw new UnauthorizedException('Code invalide ou expiré.');
    }
    this.failedAttempts.reset(dto.phone);

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      // Le code par téléphone ne protège que les comptes clients et agents de terrain. Le personnel du back-office
      // se connecte par e-mail et mot de passe : sinon, quiconque connaît son numéro prendrait son compte.
      if (!OTP_LOGIN_ROLES.includes(existing.role)) {
        throw new ForbiddenException('Ce compte se connecte par la connexion interne (e-mail et mot de passe).');
      }
      if (existing.disabled) throw new UnauthorizedException('Ce compte a été désactivé.');
    }

    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      create: { phone: dto.phone, fullName: 'Nouveau client', lastLoginAt: new Date() },
      update: { lastLoginAt: new Date() },
    });

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: sanitizeUser(user) };
  }

  /** Connexion des rôles internes — docs/decisions/0006-connexion-interne.md. Jeton de 12 h, 5 essais / 10 min. */
  async staffLogin(dto: StaffLoginDto, ip = 'inconnu') {
    const key = `${dto.email.toLowerCase()}|${ip}`;
    this.staffFailures.assertBelow(key);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const valid = !!user?.passwordHash && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!user || !valid) {
      this.staffFailures.hit(key);
      throw new UnauthorizedException('Identifiants invalides.');
    }
    if (user.disabled) throw new UnauthorizedException('Ce compte a été désactivé. Contactez un administrateur.');
    this.staffFailures.reset(key);

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role }, { expiresIn: '12h' });
    return { accessToken, user: sanitizeUser(user) };
  }

  /** Le personnel change son propre mot de passe (le mot de passe de démonstration doit disparaître avant la production). */
  async changePassword(userId: string, current: string, next: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next, 10) } });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return sanitizeUser(user);
  }
}
