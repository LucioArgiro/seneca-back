import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Turno, EstadoTurno } from '../turno/entities/turno.entity';
import { Usuario, UserRole } from '../usuario/entities/usuario.entity';
import { MovimientoCaja, TipoMovimiento } from '../caja/entities/movimiento-caja.entity';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Turno) private turnoRepo: Repository<Turno>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(MovimientoCaja) private cajaRepo: Repository<MovimientoCaja>,
  ) {}

  async getAdminStats() {
    const hoy = new Date();
    const inicioMes = startOfMonth(hoy);
    const finMes = endOfMonth(hoy);

    const { totalIngresos } = await this.turnoRepo
      .createQueryBuilder('turno')
      .leftJoin('turno.servicio', 'servicio')
      .select('SUM(servicio.precio)', 'totalIngresos')
      .where('turno.estado = :estado', { estado: EstadoTurno.COMPLETADO })
      .andWhere('turno.fecha BETWEEN :inicio AND :fin', { inicio: inicioMes, fin: finMes })
      .getRawOne();


    const turnosMes = await this.turnoRepo.count({
      where: { fecha: Between(inicioMes, finMes) }
    });
    
    const turnosCompletados = await this.turnoRepo.count({
      where: { 
        estado: EstadoTurno.COMPLETADO,
        fecha: Between(inicioMes, finMes)
      }
    });

    const turnosCancelados = await this.turnoRepo.count({
      where: { 
        estado: EstadoTurno.CANCELADO,
        fecha: Between(inicioMes, finMes)
      }
    });


    const clientesNuevos = await this.usuarioRepo.count({
      where: {
        role: UserRole.CLIENT,
        createdAt: Between(inicioMes, finMes)
      }
    });


    const ingresosPorDia = await this.turnoRepo
      .createQueryBuilder('turno')
      .leftJoin('turno.servicio', 'servicio')
      .select("DATE_FORMAT(turno.fecha, '%Y-%m-%d')", 'fecha')
      .addSelect('SUM(servicio.precio)', 'total')
      .where('turno.estado = :estado', { estado: EstadoTurno.COMPLETADO })
      .andWhere('turno.fecha BETWEEN :inicio AND :fin', { inicio: inicioMes, fin: finMes })
      .groupBy('fecha')
      .orderBy('fecha', 'ASC')
      .getRawMany();


    const topBarberos = await this.turnoRepo
      .createQueryBuilder('turno')
      .leftJoin('turno.barbero', 'barbero')
      .leftJoin('barbero.usuario', 'usuario') // Para sacar el nombre
      .leftJoin('turno.servicio', 'servicio')
      .select('usuario.nombre', 'nombre')
      .addSelect('usuario.apellido', 'apellido')
      .addSelect('COUNT(turno.id)', 'cantidad')
      .addSelect('SUM(servicio.precio)', 'ingresos')
      .where('turno.estado = :estado', { estado: EstadoTurno.COMPLETADO })
      .andWhere('turno.fecha BETWEEN :inicio AND :fin', { inicio: inicioMes, fin: finMes })
      .groupBy('barbero.id')
      .orderBy('ingresos', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      kpis: {
        ingresosTotales: Number(totalIngresos) || 0,
        turnosTotales: turnosMes,
        turnosCompletados,
        clientesNuevos,
        tasaCancelacion: turnosMes > 0 ? ((turnosCancelados / turnosMes) * 100).toFixed(1) : 0
      },
      grafico: ingresosPorDia.map(d => ({ ...d, total: Number(d.total) })), // Formato para Recharts
      ranking: topBarberos,
      proximosTurnos: await this.turnoRepo.find({
        where: { fecha: Between(hoy, finMes), estado: EstadoTurno.CONFIRMADO },
        take: 5,
        order: { fecha: 'ASC' },
        relations: ['cliente', 'servicio', 'barbero']
      })
    };
  }

}