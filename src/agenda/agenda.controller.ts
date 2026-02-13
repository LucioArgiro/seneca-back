import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateBloqueoDto } from './dto/create-bloqueo.dto'; // Asegúrate de que el nombre del archivo coincida
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) { }
  @Post('bloqueos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'BARBER')
  create(@Body() createBloqueoDto: CreateBloqueoDto) {
    return this.agendaService.crearBloqueo(createBloqueoDto);
  }

  @Get('bloqueos')
  findAll(@Query('fecha') fecha?: string) { 
    if (fecha) {
      return this.agendaService.findByDate(fecha);
    }
    return this.agendaService.findAllFuturos();
  }

  @Delete('bloqueos/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'BARBER')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.agendaService.remove(id);
  }
}