import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
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

  // 1. Obtiene la ÚNICA caja física del sistema (Donde usuario es NULL)
  private async obtenerCajaPrincipal(): Promise<Caja> {
    let cajaCentral = await this.cajaRepo.findOne({
      where: { usuario: IsNull() },
      relations: ['usuario']
    });

    if (!cajaCentral) {
      this.logger.log('📦 Creando Caja Central Única...');
      cajaCentral = this.cajaRepo.create({
        nombre: 'Caja Central (Negocio)',
        // 🔴 CORRECCIÓN CLAVE: Usamos undefined, no null, para evitar error TS
        usuario: undefined,
        saldo: 0
      });
      await this.cajaRepo.save(cajaCentral);
    }
    return cajaCentral;
  }

  // 2. Método de utilidad: SIEMPRE devuelve la central
  async obtenerCaja(usuarioId: string | null): Promise<Caja> {
    return this.obtenerCajaPrincipal();
  }

  // 3. REGISTRAR COBRO DE TURNO
  async registrarCobroTurno(turno: Turno, metodoPago: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const precioTotal = Number(turno.servicio.precio);
      const montoSenia = turno.pago?.estado === 'approved' ? Number(turno.pago.monto) : 0;
      const montoSaldo = precioTotal - montoSenia;

      if (montoSaldo > 0) {
        // SIEMPRE a la caja central
        const cajaCentral = await this.obtenerCajaPrincipal();

        const movimiento = this.movRepo.create({
          caja: cajaCentral,
          tipo: TipoMovimiento.INGRESO,
          concepto: ConceptoMovimiento.COBRO_TURNO,
          monto: montoSaldo,
          metodoPago: metodoPago,
          descripcion: `Corte de ${turno.barbero.usuario.nombre} - Cliente: ${turno.cliente.usuario.nombre}`,
          turno: turno,
          usuario: turno.barbero.usuario // Etiqueta al barbero
        });

        await queryRunner.manager.save(movimiento);

        // Actualizamos saldo de central
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

  // 4. OBTENER RESUMEN (Dashboard)
  async obtenerResumenCaja(usuarioId: string | null) {
    const cajaPrincipal = await this.obtenerCajaPrincipal();

    // A. LÓGICA DE SEGURIDAD (Admin ve Caja Central)
    let esAdmin = false;

    if (!usuarioId) {
      esAdmin = true; // Si no hay ID, es llamada interna o admin global
    } else {
      const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
      // Verificamos si existe y si es ADMIN
      if (usuario && usuario.role === UserRole.ADMIN) {
        esAdmin = true;
      }
    }

    // --- ESCENARIO A: ES ADMIN ---
    if (esAdmin) {
      const movimientos = await this.movRepo.find({
        where: { caja: { id: cajaPrincipal.id } },
        order: { fecha: 'DESC' },
        take: 100,
        relations: ['turno', 'turno.servicio', 'turno.barbero.usuario', 'usuario']
      });
      return { info: cajaPrincipal, movimientos };
    }

    // --- ESCENARIO B: ES BARBERO ---

    // 👇 VALIDACIÓN CLAVE: Si llegamos aquí y no hay ID, lanzamos error.
    // Esto arregla los errores rojos de abajo porque TypeScript ahora sabe que usuarioId es string.
    if (!usuarioId) {
      throw new BadRequestException('ID de usuario requerido para ver cuenta corriente.');
    }

    const movimientos = await this.movRepo.find({
      where: [
        // Ahora usuarioId ya no marca error porque TypeScript sabe que no es null
        { concepto: ConceptoMovimiento.COBRO_TURNO, turno: { barbero: { usuario: { id: usuarioId } } } },
        { usuario: { id: usuarioId } }
      ],
      order: { fecha: 'DESC' },
      take: 50,
      relations: ['turno', 'turno.servicio', 'usuario']
    });

    const saldoTotal = await this.calcularSaldoVirtualTotal(usuarioId);

    return {
      info: {
        id: 'virtual-wallet',
        nombre: 'Mi Cuenta Corriente',
        saldo: saldoTotal,
        usuario: { id: usuarioId }
      },
      movimientos
    };
  }

  // 5. REGISTRAR MOVIMIENTO MANUAL
  async registrarMovimientoManual(
    usuarioId: string | null,
    tipo: TipoMovimiento,
    concepto: ConceptoMovimiento,
    monto: number,
    descripcion: string
  ) {
    // 🔴 SIEMPRE usamos la Caja Central
    const cajaCentral = await this.obtenerCajaPrincipal();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Usamos el usuarioId SOLO para etiquetar (relación lógica)
      const usuarioRelacionado = usuarioId ? { id: usuarioId } : undefined;

      const movimiento = this.movRepo.create({
        caja: cajaCentral, // <-- Físicamente en Central
        tipo,
        concepto,
        monto,
        metodoPago: 'EFECTIVO',
        descripcion,
        usuario: usuarioRelacionado // <-- Etiquetado al usuario
      });

      await queryRunner.manager.save(movimiento);

      // Impactamos saldo físico de la central
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

  // --- Auxiliares ---

  async obtenerTodasLasCajas() {
    // Simulamos cajas basadas en usuarios barberos
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
    const ingresos = await this.movRepo.sum('monto', {
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

    return (ingresos || 0) + (otrosIngresos || 0) - (egresos || 0);
  }
}