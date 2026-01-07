import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from '../usuario/usuario.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';

// 👇 IMPORTS DE ENTIDADES
import { Barbero } from '../barberos/entities/barbero.entity';
import { Cliente } from '../clientes/entities/cliente.entity';

@Module({
  imports: [
    // 👇 AGREGAR ESTA LÍNEA (Registra los repositorios para que AuthService los pueda usar)
    TypeOrmModule.forFeature([Barbero, Cliente]), 
    
    UsuariosModule,
    PassportModule,
    JwtModule.register({
      secret: 'MI_PALABRA_SECRETA_SUPER_SEGURA', 
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}