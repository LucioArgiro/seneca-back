import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, MoreThan, Between } from 'typeorm';
import { BloqueoAgenda } from './entities/bloqueo-agenda.entity';
import { CreateBloqueoDto } from './dto/create-bloqueo.dto';
import { Barbero } from '../barberos/entities/barbero.entity';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(BloqueoAgenda)
    private readonly bloqueoRepo: Repository<BloqueoAgenda>,
    @InjectRepository(Barbero)
    private readonly barberoRepo: Repository<Barbero>,
  ) { }

  async crearBloqueo(dto: CreateBloqueoDto) {
    const fechaInicio = dayjs(dto.fechaInicio).toDate();
    const fechaFin = dayjs(dto.fechaFin).toDate();
    const ahora = dayjs().toDate();
    if (dayjs(fechaInicio).isBefore(ahora)) {
      throw new BadRequestException('No puedes bloquear fechas pasadas');
    }

    if (dayjs(fechaFin).isBefore(fechaInicio)) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }

    
    const colision = await this.bloqueoRepo.findOne({
      where: {
        ...(dto.esGeneral ? { esGeneral: true } : { barbero: { id: dto.barberoId } }),
        fechaInicio: LessThan(fechaFin),
        fechaFin: MoreThan(fechaInicio)
      }
    });

    if (colision) {
      throw new ConflictException('Ya existe un bloqueo o turno en este rango horario.');
    }

    const bloqueo = this.bloqueoRepo.create({
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      motivo: dto.motivo,
      esGeneral: dto.esGeneral || false,
    });

    if (!dto.esGeneral && dto.barberoId) {
      const barbero = await this.barberoRepo.findOneBy({ id: dto.barberoId });
      if (!barbero) throw new BadRequestException('Barbero no encontrado');
      bloqueo.barbero = barbero;
    } else {
      bloqueo.barbero = null;
    }

    return await this.bloqueoRepo.save(bloqueo);
  }

  async findAllFuturos() {
    const hoy = dayjs().tz("America/Argentina/Buenos_Aires").startOf('day').toDate();
    return this.bloqueoRepo.find({
      where: {
        fechaInicio: MoreThanOrEqual(hoy)
      },
      order: { fechaInicio: 'ASC' },
      relations: ['barbero'] 
    });
  }

  async remove(id: string) {
    return this.bloqueoRepo.delete(id);
  }

  async findByDate(fechaString: string) {
    const fecha = dayjs.tz(fechaString, "America/Argentina/Buenos_Aires");
    const inicioDia = fecha.startOf('day').toDate();
    const finDia = fecha.endOf('day').toDate();

    return this.bloqueoRepo.find({
      where: [
        {
          fechaInicio: Between(inicioDia, finDia)
        },
        {
          fechaInicio: LessThan(finDia),
          fechaFin: MoreThan(inicioDia)
        }
      ],
      relations: ['barbero', 'barbero.usuario'],
      order: { fechaInicio: 'ASC' }
    });
  }
}
