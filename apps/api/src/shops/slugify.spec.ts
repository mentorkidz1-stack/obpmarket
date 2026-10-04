import { describe, expect, it } from 'vitest';
import { slugify } from './shops.service.js';

describe('slugify', () => {
  it('retire les accents, les majuscules et les caractères spéciaux', () => {
    expect(slugify("Coopérative Les Palmiers d'Or")).toBe('cooperative-les-palmiers-d-or');
  });

  it('regroupe les séparateurs et supprime ceux des extrémités', () => {
    expect(slugify('  --Chez   Mamy !!  ')).toBe('chez-mamy');
  });

  it('limite la longueur sans laisser de tiret final', () => {
    const slug = slugify('a'.repeat(39) + ' bcdef');
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('renvoie une chaîne vide quand il ne reste rien', () => {
    expect(slugify('!!! ???')).toBe('');
  });
});
