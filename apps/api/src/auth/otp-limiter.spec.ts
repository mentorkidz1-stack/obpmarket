import { describe, expect, it } from 'vitest';
import { SlidingLimiter } from './otp-limiter.js';

describe('SlidingLimiter', () => {
  it('accepte jusqu\'à la limite puis refuse', () => {
    const l = new SlidingLimiter(3, 1000, 'trop');
    l.hit('a', 0);
    l.hit('a', 1);
    l.hit('a', 2);
    expect(() => l.hit('a', 3)).toThrow('trop');
  });

  it('libère après la fenêtre', () => {
    const l = new SlidingLimiter(1, 1000, 'trop');
    l.hit('a', 0);
    expect(() => l.hit('a', 500)).toThrow();
    expect(() => l.hit('a', 1500)).not.toThrow();
  });

  it('compte séparément chaque clé', () => {
    const l = new SlidingLimiter(1, 1000, 'trop');
    l.hit('a', 0);
    expect(() => l.hit('b', 0)).not.toThrow();
  });

  it('assertBelow ne compte pas et reset remet à zéro', () => {
    const l = new SlidingLimiter(2, 1000, 'trop');
    l.assertBelow('a', 0);
    l.assertBelow('a', 0);
    l.hit('a', 0);
    l.hit('a', 1);
    expect(() => l.assertBelow('a', 2)).toThrow();
    l.reset('a');
    expect(() => l.assertBelow('a', 3)).not.toThrow();
  });
});
