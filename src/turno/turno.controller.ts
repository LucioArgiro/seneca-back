import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Request } from '@nestjs/common';
import { TurnosService } from './turno.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { EstadoTurno } from './entities/turno.entity';
import { AuthGuard } from '@nestjs/passport'; // <--- EL GUARDIÁN ESTÁNDAR

@Controller('turnos')
@UseGuards(AuthGuard('jwt')) // 🔒 BLOQUEA TODO EL CONTROLADOR: Solo gente con Token entra
export class TurnosController {
  constructor(private readonly turnoService: TurnosService) {}

  @Post()
  create(@Body() createTurnoDto: CreateTurnoDto) {
    return this.turnoService.create(createTurnoDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.turnoService.findAll(req.user);
  }

  @Patch(':id/estado')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body('estado') estado: EstadoTurno
  ) {
    return this.turnoService.updateStatus(id, estado);
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/cancelar')
  async cancelarTurno(@Param('id') id: string, @Request() req) {
    // Pasamos el usuario logueado al servicio para validar propiedad
    return this.turnoService.cancelarTurno(id, req.user);
  }
}