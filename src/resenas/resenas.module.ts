import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResenasService } from './resenas.service';
import { ResenasController } from './resenas.controller';
import { Resena } from './entities/resena.entity';
import { Barbero } from '../barberos/entities/barbero.entity';
import { Cliente } from '../clientes/entities/cliente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resena, Barbero, Cliente]), 
  ],
  controllers: [ResenasController],
  providers: [ResenasService],
})
export class ResenasModule {}