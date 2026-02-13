import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Negocio } from './entities/negocio.entity';
import { UpdateNegocioDto } from './dto/update-negocio.dto';

@Injectable()
export class NegocioService {
  constructor(
    @InjectRepository(Negocio)
    private readonly negocioRepo: Repository<Negocio>,
  ) {}


  async findOne() {
    const negocios = await this.negocioRepo.find({ take: 1 });
    
    if (negocios.length > 0) {
      return negocios[0];
    }
    return null; 
  }

  // 2. GUARDAR / ACTUALIZAR (UPSERT)
  async update(updateNegocioDto: UpdateNegocioDto) {
    const existe = await this.findOne();

    if (existe) {
      await this.negocioRepo.update(existe.id, updateNegocioDto);
      return this.findOne();
    } else {
      const nuevo = this.negocioRepo.create({
        nombre: 'Mi Barbería', 
        ...updateNegocioDto
      });
      return await this.negocioRepo.save(nuevo);
    }
  }
}