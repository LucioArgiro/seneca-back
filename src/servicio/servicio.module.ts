import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importante
import { ServiciosService } from './servicio.service';
import { ServiciosController } from './servicio.controller';
import { Servicio } from './entities/servicio.entity'; // Tu entidad

@Module({
  imports: [
    // Registramos la entidad para que este módulo pueda hacer consultas a la tabla 'servicios'
    TypeOrmModule.forFeature([Servicio]) 
  ],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [ServiciosService], 
})
export class ServiciosModule {}