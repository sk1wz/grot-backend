import { Module } from '@nestjs/common';
import { StormfinderService } from './stormfinder.service';

@Module({
  providers: [StormfinderService],
  exports: [StormfinderService],
})
export class StormfinderModule {}
