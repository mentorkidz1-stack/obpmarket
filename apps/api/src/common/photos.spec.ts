import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { parsePhotoArray, publicImageUrl, publicPhotoUrls, resolvePhotoRefs } from './photos.js';

const req = { protocol: 'https', get: () => 'api.example.com' } as unknown as Request;
const DATA = 'data:image/jpeg;base64,AAAA';

describe('photos', () => {
  it('remplace les data URI par des adresses d\'images versionnées et garde les chemins publics', () => {
    const out = JSON.parse(publicPhotoUrls(req, 'products', 'p1', JSON.stringify([DATA, '/promos/a.jpg'])));
    expect(out[0]).toMatch(/^https:\/\/api\.example\.com\/products\/p1\/photo\/0\?v=[0-9a-f]{10}$/);
    expect(out[1]).toBe('/promos/a.jpg');
  });

  it('change de version quand la photo change', () => {
    const a = JSON.parse(publicPhotoUrls(req, 'products', 'p1', JSON.stringify([DATA])))[0];
    const b = JSON.parse(publicPhotoUrls(req, 'products', 'p1', JSON.stringify(['data:image/png;base64,BBBB'])))[0];
    expect(a).not.toBe(b);
  });

  it('tolère un JSON invalide', () => {
    expect(parsePhotoArray('pas du json')).toEqual([]);
    expect(parsePhotoArray(null)).toEqual([]);
  });

  it('remplace l\'image d\'une bannière seulement si c\'est une data URI', () => {
    expect(publicImageUrl(req, 'banners', 'b1', DATA)).toMatch(/\/banners\/b1\/image\?v=/);
    expect(publicImageUrl(req, 'banners', 'b1', '/promos/hero-1.jpg')).toBe('/promos/hero-1.jpg');
  });

  it('remet les adresses déjà servies à leur valeur réelle et garde les nouvelles photos', () => {
    const current = ['data:image/jpeg;base64,ONE', 'data:image/jpeg;base64,TWO'];
    const incoming = ['https://api.example.com/products/p1/photo/1?v=abc', 'data:image/jpeg;base64,NEW', 'https://api.example.com/products/p1/photo/0?v=def'];
    expect(resolvePhotoRefs(current, 'products', 'p1', incoming)).toEqual([current[1], 'data:image/jpeg;base64,NEW', current[0]]);
  });

  it('ignore une référence vers une photo qui n\'existe plus', () => {
    expect(resolvePhotoRefs([], 'products', 'p1', ['https://x/products/p1/photo/5?v=1'])).toEqual([]);
  });
});
