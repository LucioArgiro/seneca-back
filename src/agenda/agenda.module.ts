import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { BloqueoAgenda } from './entities/bloqueo-agenda.entity';
import { Barbero } from '../barberos/entities/barbero.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BloqueoAgenda, Barbero])],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService, TypeOrmModule] 
})
export class AgendaModule {}