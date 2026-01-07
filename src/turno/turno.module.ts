import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnosService } from './turno.service';
import { TurnosController } from './turno.controller';
import { Turno } from './entities/turno.entity';
import { ServiciosModule } from '../servicio/servicio.module';
import { UsuariosModule } from '../usuario/usuario.module';
import { ClientesModule } from '../clientes/clientes.module';
import { BarberosModule } from '../barberos/barberos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turno]),
    ServiciosModule, 
    UsuariosModule,  
    ClientesModule, 
    BarberosModule,
  ],
  controllers: [TurnosController],
  providers: [TurnosService],
})
export class TurnosModule {}