import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ServiciosService } from './servicio.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard'; // 👈 Importamos el Guardia
import { Roles } from '../auth/roles.decorator'; // 👈 Importamos el Decorador

@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  // 🔓 PÚBLICO: Todo el mundo necesita ver los servicios para reservar
  @Get()
  findAll() {
    return this.serviciosService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN') 
  create(@Body() createServicioDto: CreateServicioDto) {
    return this.serviciosService.create(createServicioDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateServicioDto: UpdateServicioDto) {
    return this.serviciosService.update(id, updateServicioDto);
  }

  // 🔒 SOLO ADMIN: Borrar Servicio
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.serviciosService.remove(id);
  }
}