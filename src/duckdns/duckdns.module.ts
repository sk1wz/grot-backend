import { Module } from '@nestjs/common';
import { DuckdnsService } from './duckdns.service';

@Module({
  providers: [DuckdnsService],
  exports: [DuckdnsService],
})
export class DuckdnsModule {}
