import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Limiteur en mémoire (fenêtre glissante), suffisant pour une seule instance d'API.
 * Protège la connexion par code à 6 chiffres : sans limite, un code se devine en quelques minutes.
 */
export class SlidingLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly message: string,
  ) {}

  private recent(key: string, now: number): number[] {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (list.length === 0) this.hits.delete(key);
    return list;
  }

  /** Compte une action ; refuse (429) si la limite de la fenêtre est atteinte. */
  hit(key: string, now = Date.now()): void {
    const list = this.recent(key, now);
    if (list.length >= this.max) throw new HttpException(this.message, HttpStatus.TOO_MANY_REQUESTS);
    this.hits.set(key, [...list, now]);
  }

  /** Refuse (429) si la limite est déjà atteinte, sans compter une nouvelle action. */
  assertBelow(key: string, now = Date.now()): void {
    if (this.recent(key, now).length >= this.max) throw new HttpException(this.message, HttpStatus.TOO_MANY_REQUESTS);
  }

  reset(key: string): void {
    this.hits.delete(key);
  }
}
