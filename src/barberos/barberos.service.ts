import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barbero } from './entities/barbero.entity';
import { UpdateBarberoDto } from './dto/update-barbero.dto';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { UserRole, Usuario} from '../usuario/entities/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BarberosService {
  constructor(
    @InjectRepository(Barbero) private barberoRepo: Repository<Barbero>,
    private usuarioService: UsuarioService, 
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>, 
  ) {}

  

  async findAll() {
    return this.barberoRepo.find({
      where: { activo: true }, 
      relations: ['usuario'],
    });
  }

  async findOneByUserId(usuarioId: string) {
    const barbero = await this.barberoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario'],
    });


    if (!barbero) throw new NotFoundException('Perfil de barbero no encontrado');
    const { usuario, ...datosBarbero } = barbero;
    return {
      ...datosBarbero,
      usuarioId: usuario.id,
      fullname: usuario.fullname,
      email: usuario.email,
    };
  }
  async update(usuarioId: string, updateDto: UpdateBarberoDto) {
    const barbero = await this.barberoRepo.findOne({
      where: { usuario: { id: usuarioId } }
    });

    if (!barbero) throw new NotFoundException('Barbero no encontrado');

    this.barberoRepo.merge(barbero, updateDto);
    return this.barberoRepo.save(barbero);
  }

  async createBarber(createDto: CreateBarberoDto) {
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(createDto.password, salt);
    const usuario = await this.usuarioService.create({
      fullname: createDto.fullname,
      email: createDto.email,
      password: hashPassword,
      role: UserRole.BARBER
    });
    const barbero = this.barberoRepo.create({
      usuario: usuario,
      biografia: 'Barbero del equipo',
      especialidad: 'General'
    });

    return this.barberoRepo.save(barbero);
  }

  async remove(usuarioId: string) {
    const barbero = await this.barberoRepo.findOne({ 
        where: { usuario: { id: usuarioId } },
        relations: ['usuario'] // Importante traer el usuario para editarlo
    });
    
    if (!barbero) throw new NotFoundException('Barbero no encontrado');
    barbero.activo = false;
    barbero.usuario.role = UserRole.CLIENT; 
    await this.usuarioRepo.save(barbero.usuario);
    await this.barberoRepo.save(barbero);

    return { message: 'Barbero dado de baja exitosamente (Historial conservado)' };
  }

  async reactivate(usuarioId: string) {
    const barbero = await this.barberoRepo.findOne({ 
        where: { usuario: { id: usuarioId } }
    });
    if (!barbero) throw new NotFoundException('Barbero no encontrado');

    barbero.activo = true;
    return this.barberoRepo.save(barbero);
  }

}