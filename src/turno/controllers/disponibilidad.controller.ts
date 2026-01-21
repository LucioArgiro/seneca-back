import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { TurnosService } from '../turno.service';
import { GetOcupadosDto } from '../dto/get-ocupados.dto';

@Controller('disponibilidad') 
export class DisponibilidadController {
  constructor(private readonly turnosService: TurnosService) {}

  @Get('ocupados')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getHorariosOcupados(@Query() params: GetOcupadosDto) {

    return this.turnosService.findOcupados(params.fecha, params.barberoId);
  }
}