import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, In, Between, Not } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Turno, EstadoTurno } from './entities/turno.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Barbero } from '../barberos/entities/barbero.entity';
import { ServiciosService } from '../servicio/servicio.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { BloqueoAgenda } from '../agenda/entities/bloqueo-agenda.entity';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

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

    private readonly serviciosService: ServiciosService,
  ) { }


  async create(createTurnoDto: CreateTurnoDto, usuarioIdCliente: string) {
    const { barberoId, servicioId, fecha } = createTurnoDto;

    // 1. Validaciones Básicas
    const cliente = await this.clienteRepository.findOne({
      where: { usuario: { id: usuarioIdCliente } }
    });
    if (!cliente) throw new NotFoundException('Debes completar tu perfil de Cliente antes de reservar.');

    const barbero = await this.barberoRepository.findOne({
      where: { id: createTurnoDto.barberoId }
    });
    if (!barbero) throw new NotFoundException(`El barbero seleccionado no existe.`);

    const servicio = await this.serviciosService.findOne(servicioId);
    if (!servicio) throw new NotFoundException(`El servicio no existe`);

    // 2. Cálculo de Fechas
    const fechaInicio = new Date(fecha);
    const ahora = new Date();

    if (fechaInicio < ahora) {
      throw new BadRequestException('No puedes agendar turnos en el pasado.');
    }

    // 3. Validación de Horario (Simplificada)
    // OJO: Idealmente esto debería venir de 'barbero.horarios' en el futuro
    const hora = fechaInicio.getHours();
    const esHorarioManana = hora >= 9 && hora < 14;
    const esHorarioTarde = hora >= 17 && hora < 22;

    if (!esHorarioManana && !esHorarioTarde) {
      throw new BadRequestException('La barbería está cerrada en ese horario.');
    }
    const duracionMs = servicio.duracionMinutos * 60 * 1000;
    const fechaFin = new Date(fechaInicio.getTime() + duracionMs);
    const bloqueo = await this.bloqueoRepo.findOne({
      where: [
        { esGeneral: true, fechaInicio: LessThan(fechaFin), fechaFin: MoreThan(fechaInicio) },
        { barbero: { id: barbero.id }, fechaInicio: LessThan(fechaFin), fechaFin: MoreThan(fechaInicio) }
      ]
    });

    if (bloqueo) {
      throw new ConflictException(`No disponible: ${bloqueo.motivo || 'Agenda cerrada'}`);
    }

    const turnoSolapado = await this.turnoRepository.findOne({
      where: [
        {
          barbero: { id: barbero.id },
          fecha: LessThan(fechaFin),
          fechaFin: MoreThan(fechaInicio),
          estado: In([EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO])
        }
      ]
    });

    if (turnoSolapado) {
      throw new ConflictException('El barbero ya tiene un turno ocupado en ese horario.');
    }

    const valorSenia = Number(barbero.precioSenia);
    const estadoInicial = (valorSenia === 0) ? EstadoTurno.CONFIRMADO : EstadoTurno.PENDIENTE;

    // 6. Creación
    const nuevoTurno = this.turnoRepository.create({
      cliente: cliente,
      barbero: barbero,
      servicio: servicio,
      fecha: fechaInicio,
      fechaFin: fechaFin,
      estado: estadoInicial
    });

    return await this.turnoRepository.save(nuevoTurno);
  }


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
      relations: ['cliente', 'cliente.usuario', 'servicio']
    });
  }

  async findHistoryByBarberUserId(usuarioId: string) {
    const barbero = await this.barberoRepository.findOne({ where: { usuario: { id: usuarioId } } });
    if (!barbero) return [];
    return this.turnoRepository.find({
      where: [
        { barbero: { id: barbero.id }, estado: EstadoTurno.COMPLETADO },
        { barbero: { id: barbero.id }, estado: EstadoTurno.CANCELADO }
      ],
      order: { fecha: 'DESC' },
      relations: ['cliente', 'cliente.usuario', 'servicio']
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
    let tienePermiso = false;
    if (usuario.role === 'ADMIN') {
      tienePermiso = true;
    }
    else if (usuario.role === 'BARBER') {
      if (turno.barbero.usuario.id === userIdSolicitante) tienePermiso = true;
    }
    else {
      if (turno.cliente.usuario.id === userIdSolicitante) tienePermiso = true;
    }
    if (!tienePermiso) {
      throw new ForbiddenException('No tienes permiso para cancelar este turno.');

    }

    if (usuario.role === 'CLIENT' && turno.pago && turno.pago.estado === 'approved') {
      throw new BadRequestException('Esta reserva ya fue abonada. No puedes cancelarla, pero puedes reprogramarla para otra fecha.');
    }

    turno.estado = EstadoTurno.CANCELADO;
    return await this.turnoRepository.save(turno);
  }

  async findAll() {
    return this.turnoRepository.find({
      relations: ['cliente', 'cliente.usuario', 'barbero', 'barbero.usuario', 'servicio'],
      order: { fecha: 'ASC' },
    });
  }

  async findOcupados(fecha: string, barberoId: string) {
    const fechaBase = dayjs.tz(fecha, "America/Argentina/Buenos_Aires");
    const inicioDia = fechaBase.startOf('day').toDate();
    const finDia = fechaBase.endOf('day').toDate();
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
        .tz("America/Argentina/Buenos_Aires")
        .format("HH:mm");
    });
    return horasOcupadas;
  }

  // ... MÉTODO REPROGRAMAR TAMBIÉN VALIDADO
  async reprogramar(id: string, nuevaFechaISO: string, usuario: any) {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['cliente', 'cliente.usuario', 'barbero', 'servicio']
    });

    if (!turno) throw new NotFoundException('El turno no existe.');
    const userIdSolicitante = usuario.id || usuario.sub;
    let tienePermiso = false;

    if (usuario.role === 'ADMIN') tienePermiso = true;
    else if (usuario.role === 'BARBER' && turno.barbero.usuario?.id === userIdSolicitante) tienePermiso = true;
    else if (turno.cliente.usuario.id === userIdSolicitante) tienePermiso = true;
    if (!tienePermiso) throw new ForbiddenException('No tienes permiso para modificar este turno.');
    if (turno.estado === EstadoTurno.CANCELADO || turno.estado === EstadoTurno.COMPLETADO) {
      throw new BadRequestException('No se puede reprogramar un turno cancelado o completado.');
    }
    const ahora = new Date();
    const tiempoRestante = turno.fecha.getTime() - ahora.getTime();
    const dosHorasEnMs = 12 * 60 * 60 * 1000;
    if (usuario.role === 'CLIENT' && tiempoRestante < dosHorasEnMs) {
      throw new BadRequestException('Solo se puede reprogramar con 12 horas de anticipación. Por favor contáctanos.');
    }
    const fechaInicio = new Date(nuevaFechaISO);
    const hora = fechaInicio.getHours();
    const esHorarioManana = hora >= 9 && hora < 14;
    const esHorarioTarde = hora >= 17 && hora < 22;
    if (!esHorarioManana && !esHorarioTarde) {
      throw new BadRequestException('La barbería está cerrada en ese horario.');
    }
    const duracionMs = turno.servicio.duracionMinutos * 60 * 1000;
    const fechaFin = new Date(fechaInicio.getTime() + duracionMs);
    const bloqueo = await this.bloqueoRepo.findOne({
      where: [
        {
          esGeneral: true,
          fechaInicio: LessThan(fechaFin),
          fechaFin: MoreThan(fechaInicio)
        },
        {
          barbero: { id: turno.barbero.id },
          fechaInicio: LessThan(fechaFin),
          fechaFin: MoreThan(fechaInicio)
        }
      ]
    });

    if (bloqueo) {
      throw new ConflictException(`No se puede reprogramar: ${bloqueo.motivo || 'Agenda cerrada'}`);
    }

    const turnoSolapado = await this.turnoRepository.findOne({
      where: {
        barbero: { id: turno.barbero.id },
        fecha: LessThan(fechaFin),
        fechaFin: MoreThan(fechaInicio),
        estado: In([EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO]),
        id: Not(turno.id)
      }
    });

    if (turnoSolapado) {
      throw new ConflictException('El barbero ya tiene un turno ocupado en el nuevo horario.');
    }
    turno.fecha = fechaInicio;
    turno.fechaFin = fechaFin;
    return await this.turnoRepository.save(turno);
  }

  async findByDate(fechaString: string) {
    const fecha = dayjs.tz(fechaString, "America/Argentina/Buenos_Aires");
    const inicioDia = fecha.startOf('day').toDate();
    const finDia = fecha.endOf('day').toDate();

    return this.turnoRepository.find({
      where: {
        fecha: Between(inicioDia, finDia),
        estado: Not(EstadoTurno.CANCELADO)
      },
      relations: ['cliente', 'cliente.usuario', 'barbero', 'barbero.usuario', 'servicio'],
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
    } else {
      this.logger.debug('✅ No se encontraron turnos vencidos.');
    }
  }

}