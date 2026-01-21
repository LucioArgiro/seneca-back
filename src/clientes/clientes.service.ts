import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  // Buscar perfil de cliente por ID DE USUARIO
  async findOneByUserId(usuarioId: string) {
    const cliente = await this.clienteRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario'],
    });

    if (!cliente) throw new NotFoundException('Perfil de cliente no encontrado');

    // Separamos el objeto usuario para no devolverlo anidado
    const { usuario, ...datosCliente } = cliente;

    // Retornamos todo junto y limpio
    return {
      ...datosCliente,
      usuarioId: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
    };
  }

  // Actualizar perfil (Solo datos de cliente)
  async update(usuarioId: string, updateDto: UpdateClienteDto) {
    const cliente = await this.clienteRepo.findOne({ 
        where: { usuario: { id: usuarioId } } 
    });
    
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    this.clienteRepo.merge(cliente, updateDto);
    return this.clienteRepo.save(cliente);
  }
}