import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WhatsAppService } from './whatsapp.service.js';

describe('WhatsAppService', () => {
  const env = { ...process.env };
  beforeEach(() => {
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  });
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it('est désactivé sans identifiants et n\'appelle rien', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const wa = new WhatsAppService();
    expect(wa.isConfigured()).toBe(false);
    expect(await wa.sendNotification('+22997377118', 'Bonjour')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalise le numéro et nettoie le texte', () => {
    expect(WhatsAppService.normalizePhone('+229 01 97 37 71 18')).toBe('2290197377118');
    expect(WhatsAppService.sanitizeParam('Ligne 1\nLigne 2\t\tfin   fin')).toBe('Ligne 1 · Ligne 2 · fin fin');
  });

  it('envoie un modèle de notification avec le bon corps', async () => {
    process.env.WHATSAPP_TOKEN = 'tok';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const ok = await new WhatsAppService().sendNotification('+229 01 97 37 71 18', 'Votre commande est payée');
    expect(ok).toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/123/messages');
    expect(init.headers.Authorization).toBe('Bearer tok');
    const body = JSON.parse(init.body);
    expect(body.to).toBe('2290197377118');
    expect(body.template.name).toBe('obp_notification');
    expect(body.template.components[0].parameters[0].text).toBe('Votre commande est payée');
  });

  it('envoie le code par le modèle d\'authentification (corps + bouton)', async () => {
    process.env.WHATSAPP_TOKEN = 'tok';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await new WhatsAppService().sendOtp('+22997377118', '482913');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.template.name).toBe('obp_otp');
    expect(body.template.components).toHaveLength(2);
    expect(body.template.components[1]).toMatchObject({ type: 'button', sub_type: 'url', index: '0' });
  });

  it('renvoie false (sans lever d\'erreur) quand l\'API refuse', async () => {
    process.env.WHATSAPP_TOKEN = 'tok';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => 'bad' }));
    expect(await new WhatsAppService().sendNotification('+22997377118', 'x')).toBe(false);
  });
});
