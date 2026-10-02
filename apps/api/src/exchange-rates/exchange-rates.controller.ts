import { Controller, Get } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service.js';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly rates: ExchangeRatesService) {}

  @Get()
  get() {
    return this.rates.get();
  }
}
