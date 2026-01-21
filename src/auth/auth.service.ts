import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../usuario/entities/usuario.entity';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barbero } from '../barberos/entities/barbero.entity';
import { Cliente } from '../clientes/entities/cliente.entity';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    @InjectRepository(Barbero)
    private barberoRepo: Repository<Barbero>,
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  // --- LOGIN (Igual que antes) ---
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
        nombre: user.nombre,
        apellido: user.apellido,
        role: user.role
      }
    };
  }

  async register(registerDto: any) {
    const { email, password, nombre, apellido, role } = registerDto;
    const existe = await this.usuarioService.findByEmailWithPassword(email);
    if (existe) {
      throw new BadRequestException('El email ya está registrado');
    }
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    const usuario = await this.usuarioService.create({
      nombre,
      apellido,
      email,
      password: hashPassword,
      role: role || UserRole.CLIENT 
    });
        const cliente = this.clienteRepo.create({ usuario: usuario });
        await this.clienteRepo.save(cliente);
    return usuario;
  }
}