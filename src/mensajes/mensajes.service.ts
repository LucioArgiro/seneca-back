import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { ReplyMensajeDto } from './dto/reply-mensaje.dto';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { MensajeReply } from './entities/mensaje-reply.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan } from 'typeorm';

@Injectable()
export class MensajesService {
    constructor(
        @InjectRepository(Mensaje)
        private readonly mensajeRepo: Repository<Mensaje>, // 👈 El nombre correcto es este
        
        @InjectRepository(Cliente)
        private readonly clienteRepo: Repository<Cliente>,
        
        @InjectRepository(Usuario)
        private readonly usuarioRepo: Repository<Usuario>,

        @InjectRepository(MensajeReply)
        private readonly replyRepo: Repository<MensajeReply>
    ) { }

    // 1. CREAR MENSAJE (Cliente -> Buzón General)
    async create(createDto: CreateMensajeDto, usuarioId: string) {
        try {
            const cliente = await this.clienteRepo.findOne({
                where: { usuario: { id: usuarioId } }
            });

            if (!cliente) {
                throw new BadRequestException('Tu usuario no tiene un perfil de Cliente activo.');
            }

            const nuevoMensaje = this.mensajeRepo.create({
                contenido: createDto.contenido,
                cliente: cliente,
                leido: false,
            });

            return await this.mensajeRepo.save(nuevoMensaje);

        } catch (error) {
            this.handleDBErrors(error);
        }
    }

    // 2. VER TODOS (Para Admin/Barbero)
    async findAll() {
        const mensajes = await this.mensajeRepo.find({
            // 👇 FILTRO NUEVO: Solo mostrar si NO fue eliminado por el staff
            where: { eliminadoPorStaff: false }, 
            order: { createdAt: 'DESC' },
            relations: ['cliente', 'cliente.usuario', 'respondidoPor', 'replies', 'replies.autor']
        });

        return mensajes.map(mensaje => {
            if (mensaje.replies && mensaje.replies.length > 0) {
                mensaje.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            }
            return mensaje;
        });
    }

    // 3. RESPONDER (Staff -> Cliente)
    async reply(id: string, replyDto: ReplyMensajeDto, staffUserId: string) {
        const mensaje = await this.mensajeRepo.findOneBy({ id });
        if (!mensaje) throw new NotFoundException(`Mensaje con ID ${id} no encontrado`);

        const staffUser = await this.usuarioRepo.findOneBy({ id: staffUserId });
        if (!staffUser) throw new NotFoundException('Usuario staff no encontrado');
        
        const nuevaRespuesta = this.replyRepo.create({
            texto: replyDto.respuesta,
            mensaje: mensaje,
            autor: staffUser
        });
        
        mensaje.leido = true;
        mensaje.respondidoPor = staffUser;
        mensaje.updatedAt = new Date();
        await this.mensajeRepo.save(mensaje);
        return await this.replyRepo.save(nuevaRespuesta);
    }

    // 4. VER MIS MENSAJES (Para Cliente)
    async findMyMessages(usuarioId: string) {
        const cliente = await this.clienteRepo.findOne({ where: { usuario: { id: usuarioId } } });
        if (!cliente) return [];
        const mensajes = await this.mensajeRepo.find({
            where: { 
                cliente: { id: cliente.id },
                eliminadoPorCliente: false // 👇 FILTRO NUEVO: Solo si el cliente no lo borró
            },
            order: { createdAt: 'DESC' },
            relations: ['respondidoPor', 'replies', 'replies.autor']
        });
        return mensajes.map(mensaje => {
            if (mensaje.replies && mensaje.replies.length > 0) { 
                mensaje.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); 
            }
            return mensaje;
        });
    }
    // 5. AGREGAR RESPUESTA (Hilo)
    async addReply(mensajeId: string, texto: string, autorId: string) {
        const mensaje = await this.mensajeRepo.findOneBy({ id: mensajeId });
        if (!mensaje) throw new NotFoundException('Mensaje no encontrado');
        
        const autor = await this.usuarioRepo.findOneBy({ id: autorId });
        if (!autor) {
            throw new NotFoundException('Usuario/autor no encontrado')
        }
        
        const nuevaRespuesta = this.replyRepo.create({
            texto,
            mensaje,
            autor
        });

        if (autor.role === 'CLIENT') {
             mensaje.leido = false; 
        } else {mensaje.leido = true;}
        mensaje.updatedAt = new Date();
        mensaje.eliminadoPorStaff = false;
        mensaje.eliminadoPorCliente = false;
        await this.mensajeRepo.save(mensaje);
        return await this.replyRepo.save(nuevaRespuesta);
    }

    async softDeleteMensaje(id: string, esStaff: boolean) {
        const mensaje = await this.mensajeRepo.findOne({ where: { id } });
        if (!mensaje) throw new NotFoundException('Mensaje no encontrado');
        if (esStaff) {
            mensaje.eliminadoPorStaff = true;
        } else {
            mensaje.eliminadoPorCliente = true;
        }
        if (mensaje.eliminadoPorStaff && mensaje.eliminadoPorCliente) {
            await this.mensajeRepo.delete(id);
            return { message: 'Mensaje eliminado físicamente' };
        } else {
            await this.mensajeRepo.save(mensaje);
            return { message: 'Mensaje ocultado' };
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async limpiarMensajesViejos() {
        console.log('🧹 Ejecutando limpieza automática de mensajes...');
        const fechaLimite = new Date();
        fechaLimite.setFullYear(fechaLimite.getFullYear() - 1);
        const resultado = await this.mensajeRepo.delete({
            createdAt: LessThan(fechaLimite)
        });
        console.log(`✅ Se eliminaron ${resultado.affected} mensajes antiguos.`);
    }
    private handleDBErrors(error: any): never {
        if (error instanceof BadRequestException) throw error;
        console.error(error);
        throw new InternalServerErrorException('Error al procesar el mensaje.');
    }
}