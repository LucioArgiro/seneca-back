import { BadRequestException, Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno, EstadoTurno } from './entities/turno.entity';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { ServiciosService } from '../servicio/servicio.service';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    private readonly serviciosService: ServiciosService,
    private readonly usuariosService: UsuarioService,
  ) { }
  async create(createTurnoDto: CreateTurnoDto) {
    const { clienteId, barberoId, servicioId, fecha } = createTurnoDto;
    const cliente = await this.usuariosService.findOne(clienteId);
    if (!cliente) throw new NotFoundException(`El cliente con id ${clienteId} no existe`);
    const servicio = await this.serviciosService.findOne(servicioId);
    if (!servicio) throw new NotFoundException(`El servicio con id ${servicioId} no existe`);
    const fechaInicio = new Date(fecha);
    const ahora = new Date();
    if (fechaInicio < ahora) {
      throw new BadRequestException('No puedes agendar turnos en el pasado.');
    }
    const hora = fechaInicio.getHours();
    const esHorarioManana = hora >= 9 && hora < 14;
    const esHorarioTarde = hora >= 17 && hora < 22;
    if (!esHorarioManana && !esHorarioTarde) {
      throw new BadRequestException('La barbería está cerrada en ese horario. Atendemos de 9-14hs y 17-22hs.');
    }
    const fechaFin = new Date(fechaInicio.getTime() + servicio.duracionMinutos * 60000);
    const turnoSolapado = await this.turnoRepository.createQueryBuilder('turno')
      .where('turno.barbero_id = :barberoId', { barberoId })
      .andWhere('turno.fecha < :fechaFin', { fechaFin })
      .andWhere('turno.fechaFin > :fechaInicio', { fechaInicio })
      .getOne();
    if (turnoSolapado) {
      throw new ConflictException('El barbero ya tiene un turno ocupado en ese horario.');
    }
    const nuevoTurno = this.turnoRepository.create({
      cliente: { id: clienteId },
      barbero: { id: barberoId },
      servicio: { id: servicioId },
      fecha: fechaInicio,
      fechaFin: fechaFin,
      estado: EstadoTurno.PENDIENTE
    });

    return await this.turnoRepository.save(nuevoTurno);
  }

  // Agrega findAll, findOne, etc. genéricos abajo...
  async findAll(user: any) {

    // Configuración base de la consulta (siempre traemos relaciones)
    const options: any = {
      relations: ['cliente', 'barbero', 'servicio'],
      order: { fecha: 'ASC' },
      where: {}, // Empezamos con filtro vacío
    };

    // LÓGICA DE PRIVACIDAD 🕵️‍♀️
    if (user.role === 'CLIENT') {
      // Si es cliente, SOLO ve sus turnos
      options.where = {
        cliente: { id: user.userId }
      };
    }
    // Si es BARBERO o ADMIN, el 'where' se queda vacío y ve todo.

    return await this.turnoRepository.find(options);
  }

  async updateStatus(id: string, nuevoEstado: EstadoTurno) {
    const turno = await this.turnoRepository.findOneBy({ id });

    if (!turno) {
      throw new NotFoundException(`El turno con id ${id} no existe`);
    }

    turno.estado = nuevoEstado;
    return await this.turnoRepository.save(turno);
  }

  async cancelarTurno(id: string, user: any) {
    const turno = await this.turnoRepository.findOne({ 
      where: { id },
      relations: ['cliente'] 
    });

    if (!turno) throw new NotFoundException('Turno no encontrado');

    // 🕵️‍♀️ AQUÍ ESTÁ EL MICRÓFONO: MIRA LA CONSOLA DEL BACKEND
    console.log("--- DEBUG CANCELACIÓN ---");
    console.log("ID del Turno:", turno.id);
    console.log("Dueño del Turno (DB):", turno.cliente?.id);
    console.log("Usuario que intenta cancelar (Token):", user);
    console.log("¿Coinciden?", turno.cliente?.id === user.sub);
    console.log("-------------------------");

    // Lógica de validación
    // A veces el token trae 'id' en vez de 'sub', o 'userId'. Vamos a asegurar eso.
   const userIdDelToken = user.sub || user.id || user.userId; 

    // Debug opcional: Ahora verás que sí lo encuentra
    console.log("ID recuperado del token:", userIdDelToken);

    if (user.role === 'CLIENT' && turno.cliente.id !== userIdDelToken) {
       throw new ForbiddenException('No tienes permiso para cancelar este turno.');
    }
    turno.estado = EstadoTurno.CANCELADO;
    return await this.turnoRepository.save(turno);
  }
}