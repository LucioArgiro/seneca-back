import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 Importar TypeORM
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

// 👇 Importar las entidades que vamos a analizar
import { Turno } from '../turno/entities/turno.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { MovimientoCaja } from '../caja/entities/movimiento-caja.entity';

@Module({
  imports: [
    // 👇 ESTO ES VITAL: Le damos permiso al módulo para usar estas tablas
    TypeOrmModule.forFeature([Turno, Usuario, MovimientoCaja])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}