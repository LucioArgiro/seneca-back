import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NegocioService } from './negocio.service';
import { NegocioController } from './negocio.controller';
import { Negocio } from './entities/negocio.entity';
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [TypeOrmModule.forFeature([Negocio]),AuthModule],
  controllers: [NegocioController],
  providers: [NegocioService],
})
export class NegocioModule {}