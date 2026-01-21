import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Barbero } from './entities/barbero.entity';
import { UpdateBarberoDto } from './dto/update-barbero.dto';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { UserRole, Usuario } from '../usuario/entities/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { HorarioBarbero } from './entities/horario-barbero.entity';
import * as bcrypt from 'bcrypt';


@Injectable()
export class BarberosService {
  constructor(
    @InjectRepository(Barbero) private barberoRepo: Repository<Barbero>,
    private usuarioService: UsuarioService,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly dataSource: DataSource,
  ) { }



  async findAll() {
    const barberos = await this.barberoRepo.find({
      where: { activo: true }, // 👈 FILTRO IMPORTANTE
      relations: ['usuario', 'resenasRecibidas'],
    });

    return barberos.map(barbero => {
      const resenas = barbero.resenasRecibidas || [];
      const totalPuntos = resenas.reduce((acc, r) => acc + r.calificacion, 0);
      const cantidad = resenas.length;
      const promedio = cantidad > 0 ? Number((totalPuntos / cantidad).toFixed(1)) : 0;
      const { resenasRecibidas, ...resto } = barbero;
      return { ...resto, promedio, cantidadResenas: cantidad };
    });
  }

  async findAllAdmin() {
    const barberos = await this.barberoRepo.find({
      relations: ['usuario', 'resenasRecibidas'], // Sin el where: { activo: true }
      order: { activo: 'DESC' } // Muestra activos primero
    });

    return barberos.map(barbero => {
      const resenas = barbero.resenasRecibidas || [];
      const totalPuntos = resenas.reduce((acc, r) => acc + r.calificacion, 0);
      const cantidad = resenas.length;
      const promedio = cantidad > 0 ? Number((totalPuntos / cantidad).toFixed(1)) : 0;
      const { resenasRecibidas, ...resto } = barbero;
      return { ...resto, promedio, cantidadResenas: cantidad };
    });
  }

  async findOneByUserId(usuarioId: string) {
    const barbero = await this.barberoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario', 'resenasRecibidas'],
    });

    if (!barbero) throw new NotFoundException('Perfil de barbero no encontrado');
    const resenas = barbero.resenasRecibidas || [];
    const totalPuntos = resenas.reduce((acc, r) => acc + r.calificacion, 0);
    const cantidad = resenas.length;
    const promedio = cantidad > 0 ? Number((totalPuntos / cantidad).toFixed(1)) : 0;
    return { ...barbero, promedio, cantidadResenas: cantidad };
  }

  async update(usuarioId: string, updateDto: UpdateBarberoDto) {
    return this.dataSource.transaction(async (manager) => {
      const barbero = await manager.findOne(Barbero, {
        where: { usuario: { id: usuarioId } },
        relations: ['usuario', 'horarios']
      });
      if (!barbero) throw new NotFoundException('Barbero no encontrado');
      const { fullname, email, horarios, ...datosPropios } = updateDto;
      if (fullname || email) {
        if (fullname) barbero.usuario.nombre = fullname;

        if (email && email !== barbero.usuario.email) {
          const emailExists = await manager.findOne(Usuario, { where: { email } });
          if (emailExists) throw new ConflictException('El email ya está en uso');
          barbero.usuario.email = email;
        }
        await manager.save(barbero.usuario);
      }
      if (horarios && Array.isArray(horarios)) {
        await manager.delete(HorarioBarbero, { barbero: { id: barbero.id } });
        const nuevosHorarios = horarios.map(h => {
          const horario = manager.create(HorarioBarbero, h);
          horario.barbero = barbero; 
          return horario;
        });

        barbero.horarios = nuevosHorarios;
      }
      manager.merge(Barbero, barbero, datosPropios);
      await manager.save(barbero);
      return await manager.findOne(Barbero, {
        where: { id: barbero.id },
        relations: ['usuario', 'horarios']
      });
    });
  }

  async createBarber(createDto: CreateBarberoDto) {
    const { nombre, apellido, email, password, ...datosPerfil } = createDto;
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    const usuario = await this.usuarioService.create({
      nombre,
      apellido,
      email,
      password: hashPassword,
      role: UserRole.BARBER
    });

    const barbero = this.barberoRepo.create({
      usuario: usuario,
      ...datosPerfil,
      biografia: datosPerfil.biografia || 'Barbero del equipo',
      especialidad: datosPerfil.especialidad || 'Estilista'
    });

    return this.barberoRepo.save(barbero);
  }

  async remove(usuarioId: string) {
    const barbero = await this.barberoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario']
    });

    if (!barbero) throw new NotFoundException('Barbero no encontrado');
    barbero.activo = false;
    barbero.usuario.role = UserRole.CLIENT;
    await this.usuarioRepo.save(barbero.usuario);
    await this.barberoRepo.save(barbero);
    return { message: 'Barbero dado de baja exitosamente' };
  }

  async reactivate(usuarioId: string) {
    const barbero = await this.barberoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario']
    });
    if (!barbero) throw new NotFoundException('Barbero no encontrado');
    barbero.activo = true;
    barbero.usuario.role = UserRole.BARBER; // 👈 IMPORTANTE: Devolverle el rol

    await this.usuarioRepo.save(barbero.usuario);
    return this.barberoRepo.save(barbero);
  }
}