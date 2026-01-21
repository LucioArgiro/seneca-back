import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Mensaje } from './mensaje.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('mensaje_replies')
export class MensajeReply {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    texto: string;

    // Relación con el mensaje principal (el "Ticket")
    @ManyToOne(() => Mensaje, (mensaje) => mensaje.replies, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mensaje_id' })
    mensaje: Mensaje;

    // Quién escribió esta respuesta específica (puede ser Cliente o Staff)
    @ManyToOne(() => Usuario, { eager: true })
    @JoinColumn({ name: 'autor_id' })
    autor: Usuario;

    @CreateDateColumn()
    createdAt: Date;
}