import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';

/** Global : n'importe quel module peut consigner une action du back-office. */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
