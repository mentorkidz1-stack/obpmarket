import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

/** Les photos sont stockées en base sous forme de data URI (« data:image/jpeg;base64,… »). */
const DATA_URI = /^data:([\w/+.-]+);base64,(.+)$/s;

export function baseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

function version(value: string): string {
  return createHash('md5').update(value).digest('hex').slice(0, 10);
}

export function parsePhotoArray(raw: string | null | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Remplace chaque data URI par l'adresse d'un vrai fichier image servi (et mis en cache) par l'API.
 * Sans cela, les photos en base64 alourdiraient chaque liste de plusieurs mégaoctets.
 * Les chemins et URL déjà publics (« /promos/x.jpg ») sont conservés tels quels.
 */
export function publicPhotoUrls(req: Request, kind: 'products' | 'properties', id: string, raw: string): string {
  const urls = parsePhotoArray(raw).map((p, i) => (p.startsWith('data:') ? `${baseUrl(req)}/${kind}/${id}/photo/${i}?v=${version(p)}` : p));
  return JSON.stringify(urls);
}

export function publicImageUrl(req: Request, kind: 'banners', id: string, value: string): string {
  return value.startsWith('data:') ? `${baseUrl(req)}/${kind}/${id}/image?v=${version(value)}` : value;
}

/** Envoie l'image décodée avec un cache long (l'adresse change quand la photo change : paramètre « v »). */
export function sendDataUri(res: Response, value: string | undefined): boolean {
  if (!value) return false;
  const match = DATA_URI.exec(value);
  if (!match) {
    // Photo déjà publique (chemin ou URL) : on y renvoie le visiteur.
    res.redirect(302, value);
    return true;
  }
  res.setHeader('Content-Type', match[1]);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(Buffer.from(match[2], 'base64'));
  return true;
}

/**
 * Le back-office renvoie la liste de photos qu'il a reçue de l'API : des adresses d'images déjà stockées
 * (« …/photo/2?v=… ») mêlées à de nouvelles photos (data URI). On remet les premières à leur valeur réelle.
 */
export function resolvePhotoRefs(current: string[], kind: 'products' | 'properties', id: string, incoming: string[]): string[] {
  const own = new RegExp(`/${kind}/${id}/photo/(\\d+)`);
  return incoming
    .map((s) => {
      if (s.startsWith('data:')) return s;
      const m = own.exec(s);
      return m ? current[Number(m[1])] : s;
    })
    .filter((s): s is string => typeof s === 'string' && s.length > 0);
}
