import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import compression from 'compression';
import type { Request } from 'express';
import { AppModule } from './app.module.js';
import { PhotoUrlInterceptor } from './common/photo-url.interceptor.js';
import { PrismaExceptionFilter } from './common/prisma-exception.filter.js';

async function bootstrap() {
  // bodyParser: false + notre propre json() : la limite par défaut (~100kb) est trop
  // basse pour des photos en data URI (jusqu'à 6 par produit) — on la relève, tout en
  // gardant la capture de req.rawBody nécessaire à la vérification des webhooks Nyole.
  const app = await NestFactory.create(AppModule, { rawBody: true, bodyParser: false });
  // Compresse les réponses JSON (listes de produits, prix…) : 5 à 10 fois moins d'octets à transférer.
  app.use(compression());
  app.use(
    json({
      limit: '15mb',
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  // Derrière le proxy de Render : sans cela, @Ip() renverrait l'adresse du proxy pour tous les visiteurs.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.useGlobalInterceptors(new PhotoUrlInterceptor());
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
