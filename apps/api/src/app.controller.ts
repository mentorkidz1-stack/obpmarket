import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Sans base de données : sert aux pings de maintien en éveil (voir .github/workflows/keepalive.yml). */
  @Get('health')
  health() {
    return { ok: true };
  }
}
