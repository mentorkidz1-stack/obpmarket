import { Injectable, Logger } from '@nestjs/common';

/**
 * Envoi de messages par l'API WhatsApp Business (Cloud API de Meta).
 *
 * Désactivé tant que les variables ne sont pas renseignées : l'application fonctionne sans, les notifications
 * restent alors dans le site (cloche). Prérequis côté Meta : compte WhatsApp Business vérifié, numéro dédié,
 * et deux modèles de message approuvés — voir docs/decisions/0014-notifications.md.
 *
 *   WHATSAPP_TOKEN            jeton d'accès permanent
 *   WHATSAPP_PHONE_NUMBER_ID  identifiant du numéro d'envoi
 *   WHATSAPP_TEMPLATE         modèle « notification » (1 variable : le texte)           — défaut obp_notification
 *   WHATSAPP_OTP_TEMPLATE     modèle « authentification » (code à usage unique)          — défaut obp_otp
 *   WHATSAPP_LANG             langue des modèles                                         — défaut fr
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  private get token() {
    return process.env.WHATSAPP_TOKEN ?? '';
  }
  private get phoneNumberId() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
  }
  private get lang() {
    return process.env.WHATSAPP_LANG ?? 'fr';
  }

  isConfigured(): boolean {
    return !!this.token && !!this.phoneNumberId;
  }

  /** « +229 01 97 37 71 18 » → « 2290197377118 » (format attendu par l'API). */
  static normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /** Les paramètres de modèle n'acceptent ni retours à la ligne, ni tabulations, ni longues suites d'espaces. */
  static sanitizeParam(text: string): string {
    return text.replace(/[\r\n\t]+/g, ' · ').replace(/ {2,}/g, ' ').trim().slice(0, 900);
  }

  /** Notification générique : un modèle approuvé à une variable (« OBP Market : {{1}} »). */
  sendNotification(phone: string, text: string): Promise<boolean> {
    return this.post(phone, {
      name: process.env.WHATSAPP_TEMPLATE ?? 'obp_notification',
      language: { code: this.lang },
      components: [{ type: 'body', parameters: [{ type: 'text', text: WhatsAppService.sanitizeParam(text) }] }],
    });
  }

  /** Code de connexion : modèle d'authentification (le code apparaît dans le corps et sur le bouton « Copier le code »). */
  sendOtp(phone: string, code: string): Promise<boolean> {
    return this.post(phone, {
      name: process.env.WHATSAPP_OTP_TEMPLATE ?? 'obp_otp',
      language: { code: this.lang },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
      ],
    });
  }

  private async post(phone: string, template: Record<string, unknown>): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: WhatsAppService.normalizePhone(phone), type: 'template', template }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.warn(`WhatsApp : envoi refusé (${res.status}) ${(await res.text()).slice(0, 300)}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(`WhatsApp : envoi impossible (${err instanceof Error ? err.message : err})`);
      return false;
    }
  }
}
