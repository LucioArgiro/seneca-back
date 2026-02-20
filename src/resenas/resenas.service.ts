import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resena } from './entities/resena.entity';
import { CreateResenaDto } from './dto/create-resena.dto';
import { UpdateResenaDto } from './dto/update-resena.dto';
// 👇 Usamos las entidades nuevas
import { Barbero } from '../barberos/entities/barbero.entity';
import { Cliente } from '../clientes/entities/cliente.entity';

@Injectable()
export class ResenasService {
  constructor(
    @InjectRepository(Resena)
    private resenaRepo: Repository<Resena>,
    // 👇 Inyectamos los repositorios de perfiles
    @InjectRepository(Barbero)
    private barberoRepo: Repository<Barbero>,
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) { }

  // 1. CREAR RESEÑA (Arquitectura Nueva)
  async create(createDto: CreateResenaDto, usuarioIdDelToken: string) {   
    const perfilBarbero = await this.barberoRepo.findOne({
        where: { usuario: { id: createDto.barberoId } }
    });
    
    if (!perfilBarbero) throw new NotFoundException('El barbero no tiene un perfil configurado o no existe.');

    // B. Buscar el PERFIL del Cliente (Usando el ID del token)
    const perfilCliente = await this.clienteRepo.findOne({
        where: { usuario: { id: usuarioIdDelToken } }
    });

    if (!perfilCliente) throw new UnauthorizedException('No tienes un perfil de cliente para comentar.');

    // C. Validar Duplicados (Usando los IDs de los perfiles)
    const existe = await this.resenaRepo.findOne({
      where: {
        barbero: { id: perfilBarbero.id },
        cliente: { id: perfilCliente.id }
      }
    });

    if (existe) {
       throw new BadRequestException('Ya has publicado una reseña para este barbero.');
    }

    // D. Crear la Reseña
    // Ahora pasamos los OBJETOS completos (perfilBarbero y perfilCliente)
    // TypeORM se encarga de extraer los IDs y hacer las relaciones.
    const nuevaResena = this.resenaRepo.create({
      calificacion: createDto.calificacion,
      comentario: createDto.comentario,
      barbero: perfilBarbero,
      cliente: perfilCliente,
    });

    return this.resenaRepo.save(nuevaResena);
  }

  // 2. LEER POR BARBERO
  async findAllByBarbero(usuarioBarberoId: string) {
    // Buscamos primero el ID del perfil del barbero basado en su usuario
    const perfilBarbero = await this.barberoRepo.findOne({ 
        where: { usuario: { id: usuarioBarberoId } } 
    });

    if (!perfilBarbero) return []; // Si no hay perfil, no hay reseñas

    return this.resenaRepo.find({
      where: { barbero: { id: perfilBarbero.id } },
      order: { fecha: 'DESC' },
      relations: ['cliente', 'cliente.usuario'], // 👈 Traemos Cliente Y su Usuario (para sacar el nombre)
    });
  }

  // 3. ACTUALIZAR
  async update(id: string, updateDto: UpdateResenaDto, usuarioIdToken: string) {
    const resena = await this.resenaRepo.findOne({
      where: { id },
      relations: ['cliente', 'cliente.usuario']
    });

    if (!resena) throw new NotFoundException('Reseña no encontrada');

    // Verificamos que el usuario del cliente dueño sea el mismo del token
    if (resena.cliente.usuario.id !== usuarioIdToken) {
      throw new UnauthorizedException('No puedes editar comentarios ajenos');
    }

    this.resenaRepo.merge(resena, updateDto);
    return this.resenaRepo.save(resena);
  }

  // 4. BORRAR
  async remove(id: string, usuarioIdToken: string) {
    const resena = await this.resenaRepo.findOne({
      where: { id },
      relations: ['cliente', 'cliente.usuario']
    });

    if (!resena) throw new NotFoundException('Reseña no encontrada');

    if (resena.cliente.usuario.id !== usuarioIdToken) {
      throw new UnauthorizedException('No puedes borrar comentarios ajenos');
    }

    return this.resenaRepo.remove(resena);
  }
}