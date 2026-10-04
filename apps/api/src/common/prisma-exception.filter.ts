import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Transforme les erreurs de base de données prévisibles en réponses claires, au lieu d'un « 500 Internal server error » :
 * doublon (P2002), élément introuvable (P2025), élément encore utilisé ailleurs (P2003).
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    const map: Record<string, [number, string]> = {
      P2002: [HttpStatus.CONFLICT, 'Cet élément existe déjà.'],
      P2025: [HttpStatus.NOT_FOUND, 'Élément introuvable.'],
      P2003: [HttpStatus.CONFLICT, "Cet élément est encore utilisé ailleurs : il ne peut pas être supprimé ou modifié ainsi."],
    };
    const [status, message] = map[exception.code] ?? [HttpStatus.INTERNAL_SERVER_ERROR, 'Erreur interne du serveur.'];
    // Une erreur inattendue ne doit jamais disparaître sans trace : on la consigne pour pouvoir la diagnostiquer.
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) this.logger.error(`${exception.code} : ${exception.message}`);

    res.status(status).json({ statusCode: status, message, error: status === 500 ? 'Internal Server Error' : undefined });
  }
}
