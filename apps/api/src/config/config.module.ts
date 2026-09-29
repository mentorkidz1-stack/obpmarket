import { Global, Module } from '@nestjs/common';
import { PRICING_CONFIG } from './pricing-config.token.js';
import { loadPricingConfig } from './pricing.config.js';

@Global()
@Module({
  providers: [{ provide: PRICING_CONFIG, useValue: loadPricingConfig() }],
  exports: [PRICING_CONFIG],
})
export class ConfigModule {}
