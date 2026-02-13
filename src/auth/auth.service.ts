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
    
    // 👇 Inyectamos el repo de Usuario para poder guardar el código
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,

    @InjectRepository(Barbero)
    private barberoRepo: Repository<Barbero>,
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  // ... (Tus métodos login y register existentes siguen igual) ...
  async login(email: string, pass: string) {
    // ... tu código de login ...
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
     // ... tu código de register ...
     // (Lo dejo resumido para no ocupar espacio, déjalo como lo tenías)
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
      // Por seguridad, a veces no se dice si el mail existe o no, 
      // pero para tu MVP lanzaremos error si no lo encuentra.
      throw new NotFoundException('No existe usuario con ese email');
    }

    // 1. Generar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Establecer expiración (15 minutos desde ahora)
    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 15);

    // 3. Guardar en BD
    user.recoveryCode = codigo;
    user.recoveryExpires = expiracion;
    await this.usuarioRepo.save(user);

    // 4. Retornar datos al Frontend (Para que EmailJS lo envíe)
    return {
      message: 'Código generado',
      nombre: user.nombre,
      codigoTemporale: codigo // ⚠️ El front lo necesita para EmailJS
    };
  }

  // 👇 NUEVO: Restablecer contraseña 👇
  async restablecerPassword(email: string, codigo: string, newPass: string) {
    const user = await this.usuarioRepo.findOne({ where: { email } });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // 1. Validar si el código coincide
    if (user.recoveryCode !== codigo) {
      throw new BadRequestException('El código es incorrecto');
    }

    // 2. Validar si expiró
    const ahora = new Date();
    if (!user.recoveryExpires || ahora > user.recoveryExpires) {
      throw new BadRequestException('El código ha expirado');
    }

    // 3. Hashear nueva contraseña
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPass, salt);

    // 4. Limpiar código usado
    user.recoveryCode = null;
    user.recoveryExpires = null;

    await this.usuarioRepo.save(user);

    return { message: 'Contraseña actualizada correctamente' };
  }
}