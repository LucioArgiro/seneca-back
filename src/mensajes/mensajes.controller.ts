import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';

@Controller('mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Post()
  create(@Body() createMensajeDto: CreateMensajeDto) {
    return this.mensajesService.create(createMensajeDto);
  }

  @Get()
  findAll() {
    return this.mensajesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mensajesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMensajeDto: UpdateMensajeDto) {
    return this.mensajesService.update(+id, updateMensajeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mensajesService.remove(+id);
  }
}
