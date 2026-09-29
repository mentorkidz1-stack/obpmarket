import { Module } from '@nestjs/common';
import { NyoleService } from './nyole.service.js';

@Module({
  providers: [NyoleService],
  exports: [NyoleService],
})
export class NyoleModule {}
