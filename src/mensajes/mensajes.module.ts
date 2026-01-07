import { Module } from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { MensajesController } from './mensajes.controller';

@Module({
  controllers: [MensajesController],
  providers: [MensajesService],
})
export class MensajesModule {}
