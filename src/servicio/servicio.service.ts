import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {}

  async create(createServicioDto: CreateServicioDto) {
    const servicio = this.servicioRepository.create(createServicioDto);
    return await this.servicioRepository.save(servicio);
  }

  async findAll() {
    return await this.servicioRepository.find();
  }

  async findOne(id: string) {
    const servicio = await this.servicioRepository.findOneBy({ id });
    if (!servicio) throw new NotFoundException(`Servicio ${id} no encontrado`);
    return servicio;
  }

  async update(id: string, updateServicioDto: UpdateServicioDto) {
    const servicio = await this.servicioRepository.preload({
      id: id,
      ...updateServicioDto,
    });

    if (!servicio) {
      throw new NotFoundException(`No se pudo actualizar: Servicio ${id} inexistente`);
    }

    return await this.servicioRepository.save(servicio);
  }
 async remove(id: string) {
    const servicio = await this.findOne(id); 
    try {
      return await this.servicioRepository.remove(servicio);
    } catch (error) {
      if (error.errno === 1451) {
        throw new BadRequestException('No se puede eliminar este servicio porque ya tiene turnos asociados. (Prueba editarlo en su lugar)');
      }
      throw error;
    }
  }
}