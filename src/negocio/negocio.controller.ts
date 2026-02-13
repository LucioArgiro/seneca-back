import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { NegocioService } from './negocio.service';
import { UpdateNegocioDto } from './dto/update-negocio.dto';
import { AuthGuard } from '@nestjs/passport'; // O tu JwtAuthGuard
import { RolesGuard } from '../auth/roles.guard'; // Si tienes roles
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuario/entities/usuario.entity';

@Controller('negocio')
export class NegocioController {
  constructor(private readonly negocioService: NegocioService) {}

  @Get()
  async findOne() {
    return this.negocioService.findOne();
  }

  // Endpoint Privado: Solo el ADMIN puede cambiar el teléfono o dirección
  @Put()
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  @Roles(UserRole.ADMIN)
  async update(@Body() updateNegocioDto: UpdateNegocioDto) {
    return this.negocioService.update(updateNegocioDto);
  }
}