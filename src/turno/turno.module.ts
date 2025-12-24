import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnosService } from './turno.service';
import { TurnosController } from './turno.controller';
import { Turno } from './entities/turno.entity';
// Importamos los MÓDULOS, no los servicios directamente aquí
import { ServiciosModule } from '../servicio/servicio.module';
import { UsuariosModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turno]),
    ServiciosModule, 
    UsuariosModule,  
  ],
  controllers: [TurnosController],
  providers: [TurnosService],
})
export class TurnosModule {}