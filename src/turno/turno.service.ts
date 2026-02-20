import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, In, Between, Not, FindOptionsWhere } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Turno, EstadoTurno } from './entities/turno.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Barbero } from '../barberos/entities/barbero.entity';
import { ServiciosService } from '../servicio/servicio.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { BloqueoAgenda } from '../agenda/entities/bloqueo-agenda.entity';
import { CajaService } from 'src/caja/caja.service';
import { UserRole } from 'src/usuario/entities/usuario.entity';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE_ARG = "America/Argentina/Buenos_Aires";

@Injectable()
export class TurnosService {
  private readonly logger = new Logger(TurnosService.name);

  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,

    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,

    @InjectRepository(Barbero)
    private readonly barberoRepository: Repository<Barbero>,

    @InjectRepository(BloqueoAgenda)
    private readonly bloqueoRepo: Repository<BloqueoAgenda>,

    private readonly cajaService: CajaService,
    private readonly serviciosService: ServiciosService,
  ) { }

  async create(createTurnoDto: CreateTurnoDto, usuarioIdCliente: string) {
    const { barberoId, servicioId, fecha } = createTurnoDto;
    const cliente = await this.clienteRepository.findOne({ where: { usuario: { id: usuarioIdCliente } } });
    if (!cliente) throw new NotFoundException('Debes completar tu perfil de Cliente antes de reservar.');
    const barbero = await this.barberoRepository.findOne({ where: { id: barberoId } });
    if (!barbero) throw new NotFoundException(`El barbero seleccionado no existe.`);
    const servicio = await this.serviciosService.findOne(servicioId);
    if (!servicio) throw new NotFoundException(`El servicio no existe`);
    const fechaInicio = dayjs.tz(fecha, TIMEZONE_ARG);
    const ahora = dayjs().tz(TIMEZONE_ARG);

    if (fechaInicio.isBefore(ahora)) {
      throw new BadRequestException('No puedes agendar turnos en el pasado.');
    }

    const hora = fechaInicio.hour();
    const esHorarioManana = hora >= 9 && hora < 14;
    const esHorarioTarde = hora >= 17 && hora < 22;

    if (!esHorarioManana && !esHorarioTarde) {
      throw new BadRequestException('La barbería está cerrada en ese horario.');
    }
    const fechaFin = fechaInicio.add(servicio.duracionMinutos, 'minute');
    const bloqueo = await this.bloqueoRepo.findOne({
      where: [
        { esGeneral: true, fechaInicio: LessThan(fechaFin.toDate()), fechaFin: MoreThan(fechaInicio.toDate()) },
        { barbero: { id: barbero.id }, fechaInicio: LessThan(fechaFin.toDate()), fechaFin: MoreThan(fechaInicio.toDate()) }
      ]
    });

    if (bloqueo) {
      throw new ConflictException(`Horario no disponible: ${bloqueo.motivo || 'Agenda cerrada'}`);
    }


    const turnoOcupado = await this.turnoRepository.findOne({
      where: {
        barbero: { id: barbero.id },
        fecha: fechaInicio.toDate(),
        estado: In([EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO])
      }
    });

    if (turnoOcupado) {
      throw new ConflictException('El turno ya está reservado por otro cliente.');
    }


    const solapamiento = await this.turnoRepository.findOne({
      where: {
        barbero: { id: barbero.id },
        fecha: LessThan(fechaFin.toDate()),
        fechaFin: MoreThan(fechaInicio.toDate()),
        estado: In([EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO])
      }
    });

    if (solapamiento) throw new ConflictException('El horario se superpone con otro turno existente.');
    const montoPagarCliente = createTurnoDto.montoPagar || 0;
    const valorSeniaConfig = Number(barbero.precioSenia);

    let estadoInicial = EstadoTurno.CONFIRMADO;
    if (montoPagarCliente > 0) {
      estadoInicial = EstadoTurno.PENDIENTE;
    }
    else if (valorSeniaConfig > 0) {
      estadoInicial = EstadoTurno.PENDIENTE;
    }
    const nuevoTurno = this.turnoRepository.create({
      cliente: cliente,
      barbero: barbero,
      servicio: servicio,
      fecha: fechaInicio.toDate(),
      fechaFin: fechaFin.toDate(),
      estado: estadoInicial
    });

    return await this.turnoRepository.save(nuevoTurno);
  }

  // --- MÉTODOS DE BÚSQUEDA ---

  async findAllByClientUserId(usuarioId: string) {
    const cliente = await this.clienteRepository.findOne({ where: { usuario: { id: usuarioId } } });
    if (!cliente) return [];

    return this.turnoRepository.find({
      where: { cliente: { id: cliente.id } },
      order: { fecha: 'DESC' },
      relations: ['barbero', 'barbero.usuario', 'servicio', 'pago']
    });
  }

  async findAllByBarberUserId(usuarioId: string) {
    const barbero = await this.barberoRepository.findOne({ where: { usuario: { id: usuarioId } } });
    if (!barbero) return [];
    return this.turnoRepository.find({
      where: {
        barbero: { id: barbero.id },
        estado: EstadoTurno.PENDIENTE
      },
      order: { fecha: 'ASC' },
      relations: ['cliente', 'cliente.usuario', 'servicio', 'pago']
    });
  }

  async findHistoryByBarberUserId(usuarioId: string) {
    const barbero = await this.barberoRepository.findOne({ where: { usuario: { id: usuarioId } } });
    if (!barbero) return [];

    return this.turnoRepository.find({
      where: [
        { barbero: { id: barbero.id }, estado: EstadoTurno.COMPLETADO },
        { barbero: { id: barbero.id }, estado: EstadoTurno.CANCELADO },
        { barbero: { id: barbero.id }, estado: EstadoTurno.CONFIRMADO }
      ],
      order: { fecha: 'DESC' },
      relations: ['cliente', 'cliente.usuario', 'servicio', 'pago']
    });
  }

  async updateStatus(id: string, nuevoEstado: EstadoTurno) {
    const turno = await this.turnoRepository.findOne({ where: { id } });
    if (!turno) throw new NotFoundException(`El turno no existe`);
    turno.estado = nuevoEstado;
    return await this.turnoRepository.save(turno);
  }

  async cancelarTurno(id: string, usuario: any) {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['cliente', 'cliente.usuario', 'barbero', 'barbero.usuario', 'pago']
    });

    if (!turno) throw new NotFoundException('Turno no encontrado');

    const userIdSolicitante = usuario.id || usuario.sub;
    const userRole = usuario.role;
    const isAdmin = userRole === UserRole.ADMIN;
    const isBarberOwner = userRole === UserRole.BARBER && turno.barbero.usuario.id === userIdSolicitante;
    const isClientOwner = userRole === UserRole.CLIENT && turno.cliente.usuario.id === userIdSolicitante;
    if (!isAdmin && !isBarberOwner && !isClientOwner) {
      this.logger.warn(`Intento de cancelación no autorizado: User ${userIdSolicitante} en Turno ${id}`);
      throw new ForbiddenException('No tienes permiso para cancelar este turno.');
    }

    if (isClientOwner) {
      if (turno.pago && turno.pago.estado === 'approved') {
        throw new BadRequestException('Esta reserva ya fue abonada. Por favor contáctanos para reprogramar.');
      }
      const ahora = dayjs().tz(TIMEZONE_ARG);
      const inicioTurno = dayjs(turno.fecha).tz(TIMEZONE_ARG);
      const horasRestantes = inicioTurno.diff(ahora, 'hour');
      if (horasRestantes < 12) {
        throw new BadRequestException('Solo puedes cancelar con al menos 12 horas de anticipación. Contacta al local.');
      }
    }

    // 3. Ejecutar Cancelación
    turno.estado = EstadoTurno.CANCELADO;

    const turnoGuardado = await this.turnoRepository.save(turno);

    this.logger.log(`Turno ${id} cancelado por ${userRole} (ID: ${userIdSolicitante})`);

    return turnoGuardado;
  }

  async findAll() {
    return this.turnoRepository.find({
      relations: ['cliente', 'cliente.usuario', 'barbero', 'barbero.usuario', 'servicio'],
      order: { fecha: 'ASC' },
    });
  }

  async findAllHistory() {
    return this.turnoRepository.find({
      order: { fecha: 'DESC' },
      relations: ['cliente', 'cliente.usuario', 'barbero', 'barbero.usuario', 'servicio', 'pago'],
      where: [
        { estado: EstadoTurno.COMPLETADO },
        { estado: EstadoTurno.CANCELADO }
      ]
    });
  }

  async findAllByDateRange(desde: Date, hasta: Date, barberoId?: string) {
    const where: FindOptionsWhere<Turno> = {
      fecha: Between(desde, hasta),
    };
    if (barberoId) {
      where.barbero = { usuario: { id: barberoId } };
    }
    return this.turnoRepository.find({
      where,
      relations: ['cliente', 'cliente.usuario', 'barbero', 'barbero.usuario', 'servicio'],
      order: { fecha: 'ASC' }
    });
  }

  async findOcupados(fechaString: string, barberoId: string) {
    const inicioDia = dayjs.tz(fechaString, TIMEZONE_ARG).startOf('day').toDate();
    const finDia = dayjs.tz(fechaString, TIMEZONE_ARG).endOf('day').toDate();

    const turnos = await this.turnoRepository.find({
      where: {
        barbero: { id: barberoId },
        fecha: Between(inicioDia, finDia),
        estado: Not(EstadoTurno.CANCELADO)
      },
      select: ['fecha']
    });

    const horasOcupadas = turnos.map(turno => {
      return dayjs(turno.fecha)
        .tz(TIMEZONE_ARG)
        .format("HH:mm");
    });

    return horasOcupadas;
  }

  async reprogramar(id: string, nuevaFechaISO: string, usuario: any) {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['cliente', 'cliente.usuario', 'barbero', 'servicio'] // Necesitamos servicio para duración
    });

    if (!turno) throw new NotFoundException('El turno no existe.');
    const nuevaFechaInicio = dayjs.tz(nuevaFechaISO, TIMEZONE_ARG);
    const nuevaFechaFin = nuevaFechaInicio.add(turno.servicio.duracionMinutos, 'minute');
    if (nuevaFechaInicio.isBefore(dayjs().tz(TIMEZONE_ARG))) {
      throw new BadRequestException('No puedes reprogramar al pasado.');
    }
    const solapamiento = await this.turnoRepository.findOne({
      where: {
        barbero: { id: turno.barbero.id },
        fecha: LessThan(nuevaFechaFin.toDate()),
        fechaFin: MoreThan(nuevaFechaInicio.toDate()),
        id: Not(id),
        estado: In([EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO])
      }
    });

    if (solapamiento) throw new ConflictException('El nuevo horario no está disponible.');

    turno.fecha = nuevaFechaInicio.toDate();
    turno.fechaFin = nuevaFechaFin.toDate();

    return await this.turnoRepository.save(turno);
  }

  async findByDate(fechaString: string) {
    const inicioDia = dayjs.tz(fechaString, TIMEZONE_ARG).startOf('day').toDate();
    const finDia = dayjs.tz(fechaString, TIMEZONE_ARG).endOf('day').toDate();

    return this.turnoRepository.find({
      where: {
        fecha: Between(inicioDia, finDia),
        estado: Not(EstadoTurno.CANCELADO)
      },
      relations: ['cliente', 'cliente.usuario', 'barbero', 'barbero.usuario', 'servicio', 'pago'],
      order: { fecha: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['cliente', 'cliente.usuario', 'barbero', 'servicio']
    });
    if (!turno) throw new NotFoundException('Turno no encontrado');
    return turno;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async limpiarTurnosVencidos() {
    this.logger.debug('🧹 Iniciando limpieza de turnos fantasma...');
    const tiempoLimite = new Date();
    tiempoLimite.setMinutes(tiempoLimite.getMinutes() - 15);
    const resultado = await this.turnoRepository.delete({
      estado: EstadoTurno.PENDIENTE,
      creadoEn: LessThan(tiempoLimite),
    });

    if (resultado.affected && resultado.affected > 0) {
      this.logger.log(`🗑️ Se eliminaron ${resultado.affected} turnos pendientes expirados.`);
    }
  }

  async completar(id: string, metodoPago: string) {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['servicio', 'pago', 'barbero']
    });

    if (!turno) throw new NotFoundException('Turno no encontrado');
    turno.estado = EstadoTurno.COMPLETADO;
    const turnoGuardado = await this.turnoRepository.save(turno);
    await this.cajaService.registrarCobroTurno(turno, metodoPago);

    this.logger.log(`Turno ${id} completado. Pago saldo vía: ${metodoPago}`);

    return turnoGuardado;
  }
}