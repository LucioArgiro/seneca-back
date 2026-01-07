import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Request } from '@nestjs/common';
import { TurnosService } from './turno.service'; // Asegúrate que el nombre del archivo coincida
import { CreateTurnoDto } from './dto/create-turno.dto';
import { EstadoTurno } from './entities/turno.entity';

// 👇 IMPORTAMOS NUESTROS GUARDIANES DE SEGURIDAD
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('turnos')
@UseGuards(JwtAuthGuard, RolesGuard) // 🔒 1. Doble candado para todo el controlador
export class TurnosController {
  constructor(private readonly turnoService: TurnosService) {}

  // --- CLIENTES ---

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

  // --- GESTIÓN DE ESTADO (Barberos y Admins) ---

  @Patch(':id/estado')
  @Roles('BARBER', 'ADMIN') // 🔒 El cliente NO puede cambiar su estado a "Finalizado"
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body('estado') estado: EstadoTurno
  ) {
    return this.turnoService.updateStatus(id, estado);
  }
  
  // --- ❌ CANCELACIÓN (Todos, pero con reglas) ---
  
  @Patch(':id/cancelar')
  // No ponemos @Roles porque cualquiera puede cancelar SU propio turno
  async cancelarTurno(@Param('id') id: string, @Request() req) {
    // El servicio debe validar:
    // - Si es Cliente: ¿Es MI turno?
    // - Si es Barbero: ¿Es UN turno de mi agenda?
    return this.turnoService.cancelarTurno(id, req.user);
  }
}