import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnosService } from './turno.service';
import { TurnosController } from './controllers/turno.controller'; 
import { DisponibilidadController } from './controllers/disponibilidad.controller';

import { Turno } from './entities/turno.entity';
import { BloqueoAgenda } from '../agenda/entities/bloqueo-agenda.entity';
import { Barbero } from '../barberos/entities/barbero.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { ServiciosModule } from '../servicio/servicio.module';
import { UsuariosModule } from '../usuario/usuario.module';
import { ClientesModule } from '../clientes/clientes.module';
import { BarberosModule } from '../barberos/barberos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turno, BloqueoAgenda, Barbero, Cliente]), ServiciosModule, UsuariosModule, ClientesModule,  BarberosModule,],
  controllers: [TurnosController, DisponibilidadController],
  providers: [TurnosService],
})
export class TurnosModule { }