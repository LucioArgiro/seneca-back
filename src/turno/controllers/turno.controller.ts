import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Request, Query } from '@nestjs/common';
import { TurnosService } from '../turno.service';
import { CreateTurnoDto } from '../dto/create-turno.dto';
import { EstadoTurno } from '../entities/turno.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ReprogramarTurnoDto } from '../dto/reprogramar-turno.dto';
import { PagosService } from '../../pagos/pagos.service'; // 🟢 Corregido import relativo

@Controller('turnos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TurnosController {
  constructor(
    private readonly turnoService: TurnosService,
    private readonly pagosService: PagosService
  ) { }

  // 👇 AQUÍ ESTÁ EL CAMBIO IMPORTANTE
  @Get()
  @Roles('ADMIN', 'BARBER') 
  findAll(
    @Query('fecha') fecha?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('barberoId') barberoId?: string
  ) {
    // Caso 1: Rango de fechas (Para la Agenda Global)
    if (desde && hasta) {
      return this.turnoService.findAllByDateRange(new Date(desde), new Date(hasta), barberoId);
    }
    if (fecha) {
      return this.turnoService.findByDate(fecha);
    }
    return this.turnoService.findAll();
  }

  @Post()
  @Roles('CLIENT')
  create(@Body() createTurnoDto: CreateTurnoDto, @Request() req) {
    const userId = req.user ? req.user.id : null;
    return this.turnoService.create(createTurnoDto, userId);
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
  @Roles('BARBER', 'ADMIN')
  getHistory(@Request() req) {

    if (req.user.role === 'ADMIN') {
      return this.turnoService.findAllHistory();
    }
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

  @Patch(':id/cancelar')
  @Roles('ADMIN', 'BARBER', 'CLIENT')
  async cancelarTurno(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.turnoService.cancelarTurno(id, req.user);
  }

  @Patch(':id/reprogramar')
  @Roles('ADMIN', 'BARBER', 'CLIENT')
  async reprogramar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReprogramarTurnoDto,
    @Request() req
  ) {
    return this.turnoService.reprogramar(id, dto.nuevaFecha, req.user);
  }

  @Post(':id/preferencia')
  @Roles('CLIENT')
  async crearPreferenciaPago(@Param('id', ParseUUIDPipe) id: string, @Body('tipoPago') tipoPago: 'SENIA' | 'TOTAL') {
    const turno = await this.turnoService.findOne(id);
    const preferencia = await this.pagosService.crearPreferencia(turno, tipoPago);
    return preferencia;
  }

  @Patch(':id/completar')
  async completarTurno(
    @Param('id') id: string,
    @Body('metodoPago') metodoPago: string
  ) {
    return this.turnoService.completar(id, metodoPago);
  }
}