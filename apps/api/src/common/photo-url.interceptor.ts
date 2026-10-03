import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { map } from 'rxjs';
import { publicImageUrl, publicPhotoUrls } from './photos.js';

type Json = { [key: string]: unknown };

function isPlainObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date) && !Buffer.isBuffer(v);
}

function transform(value: unknown, req: Request): unknown {
  if (Array.isArray(value)) return value.map((v) => transform(v, req));
  if (!isPlainObject(value)) return value;

  const out: Json = {};
  for (const [k, v] of Object.entries(value)) out[k] = transform(v, req);

  if (typeof out.id === 'string') {
    // Produit (y compris imbriqué dans une commande, un stock, une offre…) : photos → adresses d'images.
    if (typeof out.photos === 'string' && 'unitLabel' in out) out.photos = publicPhotoUrls(req, 'products', out.id, out.photos);
    // Bien immobilier.
    else if (typeof out.photos === 'string' && 'areaUnit' in out) out.photos = publicPhotoUrls(req, 'properties', out.id, out.photos);
    // Bannière d'accueil.
    else if (typeof out.imageUrl === 'string' && 'position' in out) out.imageUrl = publicImageUrl(req, 'banners', out.id, out.imageUrl);
  }
  return out;
}

/**
 * Remplace partout les photos en base64 par de vraies adresses d'images (mises en cache).
 * Les écrans du back-office qui rééditent les photos passent par des routes « admin » laissées telles quelles.
 */
@Injectable()
export class PhotoUrlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>();
    const path = req.path;
    const raw = path.includes('/admin') || path === '/banners/all';
    return next.handle().pipe(map((data) => (raw ? data : transform(data, req))));
  }
}
