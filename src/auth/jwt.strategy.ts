import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UsuarioService } from '../usuario/usuario.service'; // 👈 1. Importa tu servicio

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // 👇 2. Inyectamos el UsuarioService en el constructor
  constructor(private readonly usuarioService: UsuarioService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let token = null;
          if (request && request.cookies) {
            token = request.cookies['token'];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'MI_PALABRA_SECRETA_SUPER_SEGURA',
    });
  }

  async validate(payload: any) {
    // 3. Obtenemos el ID del payload (puede venir como sub o id)
    const id = payload.sub || payload.id;

    // 4. Buscamos al usuario REAL en la base de datos
    const user = await this.usuarioService.findOne(id);

    // Si el usuario fue borrado de la BD pero tiene un token viejo, lanzamos error
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      nombre: user.nombre,
      apellido: user.apellido
    };
  }
}