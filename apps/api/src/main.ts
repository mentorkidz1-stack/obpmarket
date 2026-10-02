import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import type { Request } from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // bodyParser: false + notre propre json() : la limite par défaut (~100kb) est trop
  // basse pour des photos en data URI (jusqu'à 6 par produit) — on la relève, tout en
  // gardant la capture de req.rawBody nécessaire à la vérification des webhooks Nyole.
  const app = await NestFactory.create(AppModule, { rawBody: true, bodyParser: false });
  app.use(
    json({
      limit: '15mb',
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
