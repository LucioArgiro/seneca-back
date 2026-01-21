import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Request, Query } from '@nestjs/common';
import { TurnosService } from '../turno.service'; // Asegúrate que el nombre del archivo coincida
import { CreateTurnoDto } from '../dto/create-turno.dto';
import { EstadoTurno } from '../entities/turno.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ReprogramarTurnoDto } from '../dto/reprogramar-turno.dto';
import path from 'path';

@Controller('turnos')
@UseGuards(JwtAuthGuard, RolesGuard) // 🔒 1. Doble candado para todo el controlador
export class TurnosController {
  constructor(private readonly turnoService: TurnosService) { }


  @Get()
  @Roles('ADMIN')
  findAll(@Query('fecha') fecha?: string) {
    if (fecha) {
      return this.turnoService.findByDate(fecha);
    }
    return this.turnoService.findAll();
  }


  @Post()
  @Roles('CLIENT')
  create(@Body() createTurnoDto: CreateTurnoDto, @Request() req) {
    return this.turnoService.create(createTurnoDto, req.user.id);
  }

  @Get('mis-turnos')
  @Roles('CLIENT')
  findAllMyTurns(@Request() req) {
    return this.turnoService.findAllByClientUserId(req.user.id);
  }

  // --- 💈 BARBEROS ---

  @Get('agenda')
  @Roles('BARBER')
  getMyAgenda(@Request() req) {
    return this.turnoService.findAllByBarberUserId(req.user.id);
  }

  @Get('historial-clientes')
  @Roles('BARBER')
  getHistory(@Request() req) {
    // Busca turnos COMPLETADOS/CANCELADOS de este barbero
    return this.turnoService.findHistoryByBarberUserId(req.user.id);
  }


  @Patch(':id/estado')
  @Roles('BARBER', 'ADMIN')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado') estado: EstadoTurno
  ) {
    return this.turnoService.updateStatus(id, estado);
  }

  // --- ❌ CANCELACIÓN (Todos, pero con reglas) ---

  @Patch(':id/cancelar')
  async cancelarTurno(@Param('id') id: string, @Request() req) {
    return this.turnoService.cancelarTurno(id, req.user);
  }

  @Patch(':id/reprogramar')
  async reprogramar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReprogramarTurnoDto,
    @Request() req
  ) {
    return this.turnoService.reprogramar(id, dto.nuevaFecha, req.user);
  }
}