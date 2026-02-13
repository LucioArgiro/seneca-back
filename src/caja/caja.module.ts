import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CajaService } from './caja.service';
import { CajaController } from './caja.controller';
import { Caja } from './entities/caja.entity';
import { MovimientoCaja } from './entities/movimiento-caja.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Caja, MovimientoCaja, Usuario]),
  ],
  controllers: [CajaController],
  providers: [CajaService],
  exports: [CajaService], // 👈 opcional pero recomendable
})
export class CajaModule {}
