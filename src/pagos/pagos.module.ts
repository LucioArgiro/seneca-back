import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from './entities/pago.entity';
import { Turno } from '../turno/entities/turno.entity';
import { Caja } from '../caja/entities/caja.entity';
import { MovimientoCaja } from '../caja/entities/movimiento-caja.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, Turno, Caja, MovimientoCaja]), 
  ],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService]
})
export class PagosModule {}