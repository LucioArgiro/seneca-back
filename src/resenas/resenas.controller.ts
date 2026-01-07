import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, ParseUUIDPipe
} from '@nestjs/common';
import { ResenasService } from './resenas.service';
import { CreateResenaDto } from './dto/create-resena.dto';
import { UpdateResenaDto } from './dto/update-resena.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenasService: ResenasService) { }

  @Post()
  @UseGuards(JwtAuthGuard) 
  create(@Body() createResenaDto: CreateResenaDto, @Request() req) {
    return this.resenasService.create(createResenaDto, req.user.id);
  }

  @Get('barbero/:id')
  findAllByBarbero(@Param('id', ParseUUIDPipe) barberoId: string) {
    return this.resenasService.findAllByBarbero(barberoId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateResenaDto: UpdateResenaDto,
    @Request() req
  ) {
    return this.resenasService.update(id, updateResenaDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) // 👈 Y aquí
  remove(@Param('id') id: string, @Request() req) {
    return this.resenasService.remove(id, req.user.id);
  }
}