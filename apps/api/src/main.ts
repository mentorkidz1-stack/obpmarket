import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // rawBody: true expose req.rawBody — nécessaire pour vérifier la signature HMAC des
  // webhooks Nyole sur le corps brut, avant tout reparsing JSON (docs Nyole).
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
