import { Controller, Get, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // Obtener MI perfil de cliente
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyProfile(@Request() req) {
    return this.clientesService.findOneByUserId(req.user.id);
  }

  // Editar MI perfil
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@Body() updateDto: UpdateClienteDto, @Request() req) {
    return this.clientesService.update(req.user.id, updateDto);
  }
}