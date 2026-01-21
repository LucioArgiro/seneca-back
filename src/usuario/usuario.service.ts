import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario, UserRole } from './entities/usuario.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) { }
  
  async create(createUsuarioDto: CreateUsuarioDto) {
    try {
      const usuario = this.usuarioRepository.create(createUsuarioDto);
      
      await this.usuarioRepository.save(usuario);
      const { password, ...result } = usuario;
      return result;

    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  private handleDBErrors(error: any): never {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new BadRequestException('El email ya está registrado');
    }
    console.log(error);
    throw new InternalServerErrorException('Por favor revisa los logs del servidor');
  }

  async findAll(role?: UserRole) {
    if (role) {
      return await this.usuarioRepository.find({
        where: { role: role, isActive: true } 
      });
    }

    return await this.usuarioRepository.find();
  }

  async findByEmailWithPassword(email: string) {
    return await this.usuarioRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'nombre', 'apellido', 'role'],
    });
  }
  
  async findOne(id: string) { return await this.usuarioRepository.findOneBy({ id }); }
  update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    return `This action updates a #${id} usuario`;
  }
  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }
}
