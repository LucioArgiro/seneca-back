import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarberosService } from './barberos.service';
import { BarberosController } from './barberos.controller';
import { Barbero } from './entities/barbero.entity';
import { UsuariosModule } from '../usuario/usuario.module';
import { Usuario } from 'src/usuario/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Barbero, Usuario]), UsuariosModule],
  controllers: [BarberosController],
  providers: [BarberosService],
  exports: [TypeOrmModule], // 👈 ¡CLAVE! Exportamos esto para que Auth pueda guardar barberos
})
export class BarberosModule {}