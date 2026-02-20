import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not, Between } from 'typeorm'; // Agregamos Between
import * as ExcelJS from 'exceljs'; // Importamos ExcelJS

import { Caja } from './entities/caja.entity';
import { Usuario, UserRole } from '../usuario/entities/usuario.entity';
import { MovimientoCaja, TipoMovimiento, ConceptoMovimiento } from './entities/movimiento-caja.entity';
import { Turno } from '../turno/entities/turno.entity';

@Injectable()
export class CajaService {
  private readonly logger = new Logger(CajaService.name);

  constructor(
    @InjectRepository(Caja) private cajaRepo: Repository<Caja>,
    @InjectRepository(MovimientoCaja) private movRepo: Repository<MovimientoCaja>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    private dataSource: DataSource,
  ) { }

  // =================================================================
  // 1. LÓGICA DE CAJA CENTRAL (FÍSICA)
  // =================================================================

  // Obtiene la ÚNICA caja física del sistema (Donde usuario es NULL)
  private async obtenerCajaPrincipal(): Promise<Caja> {
    let cajaCentral = await this.cajaRepo.findOne({
      where: { usuario: IsNull() },
      relations: ['usuario']
    });

    if (!cajaCentral) {
      this.logger.log('📦 Creando Caja Central Única...');
      cajaCentral = this.cajaRepo.create({
        nombre: 'Caja Central (Negocio)',
        // Usamos undefined para que TypeORM entienda que es NULL en la BD
        usuario: undefined,
        saldo: 0
      });
      await this.cajaRepo.save(cajaCentral);
    }
    return cajaCentral;
  }

  // Método público para obtener la caja (siempre devuelve la central)
  async obtenerCaja(usuarioId: string | null): Promise<Caja> {
    return this.obtenerCajaPrincipal();
  }

  // =================================================================
  // 2. REGISTRO DE MOVIMIENTOS AUTOMÁTICOS (Turnos)
  // =================================================================

  async registrarCobroTurno(turno: Turno, metodoPago: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const precioTotal = Number(turno.servicio.precio);
      const montoSenia = turno.pago?.estado === 'approved' ? Number(turno.pago.monto) : 0;
      const montoSaldo = precioTotal - montoSenia;

      // Solo registramos si hay saldo pendiente por cobrar en el local
      if (montoSaldo > 0) {
        // El dinero FÍSICO entra a la Caja Central
        const cajaCentral = await this.obtenerCajaPrincipal();

        const movimiento = this.movRepo.create({
          caja: cajaCentral,
          tipo: TipoMovimiento.INGRESO,
          concepto: ConceptoMovimiento.COBRO_TURNO,
          monto: montoSaldo,
          metodoPago: metodoPago,
          // Descripción detallada
          descripcion: `Corte de ${turno.barbero.usuario.nombre} - Cliente: ${turno.cliente.usuario?.nombre || 'Cliente'}`,
          turno: turno,
          usuario: turno.barbero.usuario // ETIQUETAMOS al barbero para su "billetera virtual"
        });

        await queryRunner.manager.save(movimiento);

        // Actualizamos saldo real de la caja central
        cajaCentral.saldo = Number(cajaCentral.saldo) + Number(montoSaldo);
        await queryRunner.manager.save(cajaCentral);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error cobro: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =================================================================
  // 3. REGISTRO DE MOVIMIENTOS MANUALES (Ingresos/Egresos varios)
  // =================================================================

  async registrarMovimientoManual(
    usuarioId: string | null,
    tipo: TipoMovimiento,
    concepto: ConceptoMovimiento,
    monto: number,
    descripcion: string
  ) {
    // SIEMPRE impactamos la Caja Central
    const cajaCentral = await this.obtenerCajaPrincipal();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Si viene un usuarioId (ej: Barbero retirando dinero), lo etiquetamos
      const usuarioRelacionado = usuarioId ? { id: usuarioId } : undefined;

      const movimiento = this.movRepo.create({
        caja: cajaCentral, // Dinero sale/entra de la caja física
        tipo,
        concepto,
        monto,
        metodoPago: 'EFECTIVO', // Por defecto manual suele ser efectivo
        descripcion,
        usuario: usuarioRelacionado // Etiqueta para filtrar luego
      });

      await queryRunner.manager.save(movimiento);

      // Actualizamos el saldo físico
      if (tipo === TipoMovimiento.INGRESO) {
        cajaCentral.saldo = Number(cajaCentral.saldo) + Number(monto);
      } else {
        cajaCentral.saldo = Number(cajaCentral.saldo) - Number(monto);
      }

      await queryRunner.manager.save(cajaCentral);
      await queryRunner.commitTransaction();

      return movimiento;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =================================================================
  // 4. CONSULTA DE DASHBOARD (Resumen y Movimientos Recientes)
  // =================================================================

  async obtenerResumenCaja(usuarioId: string | null) {
    const cajaPrincipal = await this.obtenerCajaPrincipal();

    // Validamos permisos y roles
    let esAdmin = false;
    if (!usuarioId) {
      esAdmin = true; // Si es null, asumimos sistema/admin
    } else {
      const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
      if (usuario && usuario.role === UserRole.ADMIN) {
        esAdmin = true;
      }
    }

    // --- CASO A: ADMIN (Ve todo) ---
    if (esAdmin) {
      const movimientos = await this.movRepo.find({
        where: { caja: { id: cajaPrincipal.id } },
        order: { fecha: 'DESC' },
        take: 100, // Límite para performance
        relations: ['turno', 'turno.servicio', 'turno.barbero.usuario', 'usuario']
      });
      return { info: cajaPrincipal, movimientos };
    }    
    if (!usuarioId) {
    throw new BadRequestException('ID de usuario requerido para ver cuenta corriente.');
  }
  const movimientos = await this.movRepo.find({
    where: [{ concepto: ConceptoMovimiento.COBRO_TURNO, turno: { barbero: { usuario: { id: usuarioId } } } },{ usuario: { id: usuarioId } }], order: { fecha: 'DESC' },take: 50, relations: ['turno', 'turno.servicio', 'usuario']
  });

  const saldoVirtual = await this.calcularSaldoVirtualTotal(usuarioId);
  const date = new Date();
  const primerDia = new Date(date.getFullYear(), date.getMonth(), 1);
  const ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  const turnosDelMes = await this.dataSource.getRepository(Turno).find({
    where: {barbero: { usuario: { id: usuarioId } }, fecha: Between(primerDia, ultimoDia)},relations: ['pago']
  });

  let seniasAdminMes = 0;
  
  turnosDelMes.forEach(turno => {
    if (turno.pago && turno.pago.estado === 'approved') {
      seniasAdminMes += Number(turno.pago.monto);
    }
  });
  return {
    info: {
      id: 'virtual-wallet',
      nombre: 'Mi Cuenta Corriente',
      saldo: saldoVirtual,
      usuario: { id: usuarioId },
      seniasMes: seniasAdminMes
    },
    movimientos
  };
}

  // =================================================================
  // 5. EXPORTACIÓN A EXCEL (Nuevo Feature)
  // =================================================================

  async generarExcelMensual(cajaId: string, mes: number, anio: number) {
    // 1. Definir rango de fechas
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

    // 2. Buscar TODOS los movimientos (sin límite de 'take')
    // Nota: Aquí usamos una lógica simple: si pasas ID, filtramos por esa caja/usuario.
    // Si es ADMIN viendo CENTRAL, trae todo.
    
    // Para simplificar: Traemos de la caja central y filtramos por fecha
    const movimientos = await this.movRepo.find({
      where: {
        caja: { nombre: 'Caja Central (Negocio)' }, // Aseguramos buscar en la física
        fecha: Between(fechaInicio, fechaFin)
      },
      order: { fecha: 'ASC' },
      relations: ['usuario', 'turno', 'turno.barbero.usuario']
    });

    // 3. Crear Libro
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Reporte ${mes}-${anio}`);

    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Concepto', key: 'concepto', width: 25 },
      { header: 'Tipo', key: 'tipo', width: 10 },
      { header: 'Monto', key: 'monto', width: 15 },
      { header: 'Responsable / Barbero', key: 'responsable', width: 25 },
      { header: 'Descripción', key: 'desc', width: 40 },
    ];

    // Estilos Header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AF37' } };

    let totalIngresos = 0;
    let totalEgresos = 0;

    movimientos.forEach(m => {
        const esIngreso = m.tipo === TipoMovimiento.INGRESO;
        if(esIngreso) totalIngresos += Number(m.monto);
        else totalEgresos += Number(m.monto);

        // Intentamos sacar el nombre del responsable
        let responsable = m.usuario?.nombre || 'Admin/Sistema';
        if (m.turno?.barbero?.usuario) {
            responsable = m.turno.barbero.usuario.nombre;
        }

        sheet.addRow({
            fecha: m.fecha.toISOString().split('T')[0],
            concepto: m.concepto,
            tipo: m.tipo,
            monto: esIngreso ? Number(m.monto) : -Number(m.monto),
            responsable: responsable,
            desc: m.descripcion
        });
    });

    sheet.addRow({});
    const totalRow = sheet.addRow({ concepto: 'BALANCE FINAL', monto: totalIngresos - totalEgresos });
    totalRow.font = { bold: true };

    return await workbook.xlsx.writeBuffer();
  }

  // =================================================================
  // 6. MÉTODOS AUXILIARES
  // =================================================================

  async obtenerTodasLasCajas() {
    // Devuelve una lista "virtual" de cajas para el selector del Admin
    const barberos = await this.dataSource.getRepository(Usuario).find({
      where: { role: UserRole.BARBER }
    });
    
    return barberos.map(user => ({
      id: user.id,
      nombre: `Caja de ${user.nombre}`,
      saldo: 0,
      usuario: user
    }));
  }
  async getCajaByUserId(userId: string) {
    return this.obtenerResumenCaja(userId);
  }
  private async calcularSaldoVirtualTotal(usuarioId: string): Promise<number> {
    // A. Ingresos por Turnos (Comisiones/Cobros)
    const ingresosTurnos = await this.movRepo.sum('monto', {
      concepto: ConceptoMovimiento.COBRO_TURNO,
      turno: { barbero: { usuario: { id: usuarioId } } }
    });
    const otrosIngresos = await this.movRepo.sum('monto', {
      usuario: { id: usuarioId },
      tipo: TipoMovimiento.INGRESO,
      concepto: Not(ConceptoMovimiento.COBRO_TURNO)
    });
    const egresos = await this.movRepo.sum('monto', {
      usuario: { id: usuarioId },
      tipo: TipoMovimiento.EGRESO
    });

    return (ingresosTurnos || 0) + (otrosIngresos || 0) - (egresos || 0);
  }
}