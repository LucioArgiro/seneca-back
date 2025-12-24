import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../usuario/entities/usuario.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
  ) {}

  // --- LOGIN (Ya lo tenías) ---
  async login(email: string, pass: string) {
    const user = await this.usuarioService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (Email)');
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas (Pass)');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullname: user.fullname,
        role: user.role
      }
    };
  }

  async register(registerDto: any) {
    const { email, password, fullname } = registerDto;
    const existe = await this.usuarioService.findByEmailWithPassword(email);
    if (existe) {
      throw new BadRequestException('El email ya está registrado');
    }
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    return await this.usuarioService.create({
      fullname,
      email,
      password: hashPassword,
      role: UserRole.CLIENT
    });
  }
}