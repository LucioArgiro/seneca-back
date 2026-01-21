import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajesService } from './mensajes.service';
import { MensajesController } from './mensajes.controller';
import { Mensaje } from './entities/mensaje.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { MensajeReply } from './entities/mensaje-reply.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Mensaje, Cliente, Usuario, MensajeReply])
    ],
    controllers: [MensajesController],
    providers: [MensajesService, MensajeReply],
    exports: [MensajesService]
})
export class MensajesModule {}