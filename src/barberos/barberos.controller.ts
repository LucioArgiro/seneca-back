import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { BarberosService } from './barberos.service';
import { UpdateBarberoDto } from './dto/update-barbero.dto';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('barberos')
export class BarberosController {
  constructor(private readonly barberosService: BarberosService) { }


  @Get()
  findAll() {
    return this.barberosService.findAll();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAllAdmin() {
    return this.barberosService.findAllAdmin();
  }

  @Get(':usuarioId')
  findOne(@Param('usuarioId') usuarioId: string) {
    return this.barberosService.findOneByUserId(usuarioId);
  }


  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateSelf(@Body() updateDto: UpdateBarberoDto, @Request() req) {
    return this.barberosService.update(req.user.id, updateDto);
  }


  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createDto: CreateBarberoDto) {
    return this.barberosService.createBarber(createDto); // 👈 ¡Ahora sí guarda!
  }


  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateByAdmin(
    @Param('id', ParseUUIDPipe) id: string, // 👈 Validamos que sea UUID
    @Body() updateDto: UpdateBarberoDto
  ) {
    return this.barberosService.update(id, updateDto);
  }


  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.barberosService.remove(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  reactivate(@Param('id') id: string) {
    return this.barberosService.reactivate(id);
  }
}