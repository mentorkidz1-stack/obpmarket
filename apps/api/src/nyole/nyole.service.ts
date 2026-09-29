import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

const API_BASE = process.env.NYOLE_API_BASE ?? 'https://app.nyole.com/api';
const SECRET_KEY = process.env.NYOLE_SECRET_KEY ?? '';
/// Anti-rejeu — refuse un webhook dont l'horodatage a plus de 5 minutes (doc Nyole).
const SIGNATURE_TOLERANCE_SECONDS = 300;

export interface NyoleCheckoutSession {
  id: string;
  url: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  livemode: boolean;
  created: string;
}

export interface NyoleWebhookEvent {
  event: 'payment.completed' | 'payment.failed' | 'payment.cancelled' | 'payment.updated';
  livemode: boolean;
  data: {
    id: string;
    order_id: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED' | 'REFUNDED';
    amount: number;
    currency: string;
    provider?: string;
    provider_reference?: string;
    metadata?: Record<string, string>;
    completed_at: string | null;
  };
  timestamp: string;
}

/**
 * Client pour l'API Nyole (passerelle mobile money/carte, docs/decisions/0008-nyole.md).
 * Nyole encaisse pour nous ; aucune donnée de carte ou de mobile money ne transite par
 * notre serveur — le client paie sur la page hébergée par Nyole.
 */
@Injectable()
export class NyoleService {
  private readonly logger = new Logger(NyoleService.name);

  async createCheckoutSession(params: {
    amount: number;
    orderId: string;
    customerName?: string;
    customerPhone?: string;
    description?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<NyoleCheckoutSession> {
    const res = await fetch(`${API_BASE}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': params.orderId,
      },
      body: JSON.stringify({
        amount: Math.round(params.amount),
        currency: 'XOF',
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        description: params.description,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: { order_id: params.orderId },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Échec création session Nyole (${res.status}) : ${body}`);
      throw new Error("Impossible de créer la session de paiement Nyole.");
    }

    return res.json() as Promise<NyoleCheckoutSession>;
  }

  async getSessionStatus(sessionId: string) {
    const res = await fetch(`${API_BASE}/v1/checkout/sessions/${sessionId}/status`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });
    if (!res.ok) throw new Error(`Échec de la vérification du statut Nyole (${res.status}).`);
    return res.json() as Promise<{ id: string; status: string; paid: boolean }>;
  }

  /**
   * Vérifie la signature HMAC-SHA256 d'un webhook sur le corps BRUT (avant reparsing
   * JSON) — sans ça n'importe qui connaissant l'URL pourrait simuler un paiement.
   */
  verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): boolean {
    const timestampHeader = headers['x-afriflow-timestamp'];
    const signatureHeader = headers['x-afriflow-signature'];
    const timestamp = Array.isArray(timestampHeader) ? timestampHeader[0] : timestampHeader;
    const signatureRaw = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const signature = signatureRaw?.split(',').find((p) => p.startsWith('v1='))?.slice(3);

    if (!timestamp || !signature) return false;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) return false;

    const expected = createHmac('sha256', SECRET_KEY).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}
