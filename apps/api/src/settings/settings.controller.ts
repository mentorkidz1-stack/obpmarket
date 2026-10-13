import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

const LABELS: Record<string, string> = {
  vatEnabled: 'TVA activée',
  vatRate: 'taux de TVA',
  vatDefaultDisplay: 'affichage par défaut',
  markupPct: 'majoration du prix',
  storageFreeDays: 'jours gratuits',
  storageFeePct: 'frais de stockage',
  storageFeeMonthly: 'frais mensuels',
};

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Ce que le site doit savoir pour afficher les prix : TVA et frais de stockage.
   * La majoration, elle, est déjà incluse dans les prix renvoyés par l'API.
   */
  @Get('public')
  async publicSettings() {
    const s = await this.settings.get();
    return {
      vat: { enabled: s.vatEnabled, rate: s.vatRate, defaultDisplay: s.vatDefaultDisplay },
      storage: { freeDays: s.storageFreeDays, feePct: s.storageFeePct, monthly: s.storageFeeMonthly },
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  all() {
    return this.settings.get();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Req() req: AuthenticatedRequest, @Body() dto: UpdateSettingsDto) {
    const before = await this.settings.get();
    const patch = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    const after = await this.settings.update(patch);
    const changes = Object.keys(patch)
      .filter((k) => (before as unknown as Record<string, unknown>)[k] !== (after as unknown as Record<string, unknown>)[k])
      .map((k) => `${LABELS[k] ?? k} : ${(before as unknown as Record<string, unknown>)[k]} → ${(after as unknown as Record<string, unknown>)[k]}`);
    if (changes.length) await this.audit.log(req, 'Réglages modifiés', 'Réglages commerciaux', changes.join(' · '));
    return after;
  }
}
