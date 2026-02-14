import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole, Usuario } from '../usuario/entities/usuario.entity'; // 👈 Importa Usuario
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
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Barbero)
    private barberoRepo: Repository<Barbero>,
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usuarioService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas (Email)');
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Credenciales inválidas (Pass)');
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, nombre: user.nombre, apellido: user.apellido, role: user.role }
    };
  }

  async register(registerDto: any) {
     const { email, password, nombre, apellido, telefono, role } = registerDto;
     const existe = await this.usuarioService.findByEmailWithPassword(email);
     if (existe) throw new BadRequestException('El email ya está registrado');
     const salt = await bcrypt.genSalt();
     const hashPassword = await bcrypt.hash(password, salt);
     const usuario = await this.usuarioService.create({
       nombre, apellido, telefono, email, password: hashPassword, role: role || UserRole.CLIENT 
     });
     const cliente = this.clienteRepo.create({ usuario: usuario });
     await this.clienteRepo.save(cliente);
     return usuario;
  }


  // 👇 NUEVO: Generar código de recuperación 👇
  async solicitarRecuperacion(email: string) {
    const user = await this.usuarioRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('No existe usuario con ese email');
    }
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 15);
    user.recoveryCode = codigo;
    user.recoveryExpires = expiracion;
    await this.usuarioRepo.save(user);
    return {
      message: 'Código generado',
      nombre: user.nombre,
      codigoTemporale: codigo
    };
  }

  async restablecerPassword(email: string, codigo: string, newPass: string) {
    const user = await this.usuarioRepo.findOne({ where: { email } });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.recoveryCode !== codigo) {
      throw new BadRequestException('El código es incorrecto');
    }

    const ahora = new Date();
    if (!user.recoveryExpires || ahora > user.recoveryExpires) {
      throw new BadRequestException('El código ha expirado');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPass, salt);
    user.recoveryCode = null;
    user.recoveryExpires = null;
    await this.usuarioRepo.save(user);
    return { message: 'Contraseña actualizada correctamente' };
  }
}