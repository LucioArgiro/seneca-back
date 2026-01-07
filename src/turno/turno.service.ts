import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, In } from 'typeorm';
import { Turno, EstadoTurno } from './entities/turno.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Barbero } from '../barberos/entities/barbero.entity';
import { ServiciosService } from '../servicio/servicio.service'; // Ajusta la ruta si es necesario
import { CreateTurnoDto } from './dto/create-turno.dto';

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Barbero)
    private readonly barberoRepository: Repository<Barbero>,
    private readonly serviciosService: ServiciosService,
  ) { }

  async create(createTurnoDto: CreateTurnoDto, usuarioIdCliente: string) {
    const { barberoId, servicioId, fecha } = createTurnoDto;
    const cliente = await this.clienteRepository.findOne({
      where: { usuario: { id: usuarioIdCliente } }
    });
    if (!cliente) throw new NotFoundException('Debes completar tu perfil de Cliente antes de reservar.');
    const barbero = await this.barberoRepository.findOne({
      where: { usuario: { id: barberoId } }
    });
    if (!barbero) throw new NotFoundException(`El barbero seleccionado no existe o no tiene perfil configurado.`);
    const servicio = await this.serviciosService.findOne(servicioId);
    if (!servicio) throw new NotFoundException(`El servicio no existe`);
    const fechaInicio = new Date(fecha);
    const ahora = new Date();
    if (fechaInicio < ahora) {
      throw new BadRequestException('No puedes agendar turnos en el pasado.');
    }
    const hora = fechaInicio.getHours();
    const esHorarioManana = hora >= 9 && hora < 14;
    const esHorarioTarde = hora >= 17 && hora < 22;

    if (!esHorarioManana && !esHorarioTarde) {
      throw new BadRequestException('La barbería está cerrada en ese horario.');
    }
    const duracionMs = servicio.duracionMinutos * 60 * 1000;
    const fechaFin = new Date(fechaInicio.getTime() + duracionMs);
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
    const nuevoTurno = this.turnoRepository.create({
      cliente: cliente,
      barbero: barbero,
      servicio: servicio,
      fecha: fechaInicio,
      fechaFin: fechaFin,
      estado: EstadoTurno.PENDIENTE
    });

    return await this.turnoRepository.save(nuevoTurno);
  }
  async findAllByClientUserId(usuarioId: string) {
    const cliente = await this.clienteRepository.findOne({ where: { usuario: { id: usuarioId } } });
    if (!cliente) return []; // Si no tiene perfil, no tiene turnos
    return this.turnoRepository.find({
      where: { cliente: { id: cliente.id } },
      order: { fecha: 'DESC' }, // Los más nuevos primero
      relations: ['barbero', 'barbero.usuario', 'servicio'] // Traemos datos para mostrar
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
      relations: ['cliente', 'cliente.usuario', 'barbero', 'barbero.usuario']
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

    turno.estado = EstadoTurno.CANCELADO;
    return await this.turnoRepository.save(turno);
  }

  async findAll() {
    return this.turnoRepository.find({
      relations: ['cliente', 'cliente.usuario', 'barbero', 'barbero.usuario', 'servicio'],
      order: { fecha: 'ASC' },
    });
  }

}