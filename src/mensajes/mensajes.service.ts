import { Injectable } from '@nestjs/common';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';

@Injectable()
export class MensajesService {
  create(createMensajeDto: CreateMensajeDto) {
    return 'This action adds a new mensaje';
  }

  findAll() {
    return `This action returns all mensajes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mensaje`;
  }

  update(id: number, updateMensajeDto: UpdateMensajeDto) {
    return `This action updates a #${id} mensaje`;
  }

  remove(id: number) {
    return `This action removes a #${id} mensaje`;
  }
}
