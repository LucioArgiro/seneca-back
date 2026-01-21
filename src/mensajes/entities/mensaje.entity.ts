import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { MensajeReply } from './mensaje-reply.entity';

@Entity('mensajes')
export class Mensaje {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    contenido: string;

    @Column({ default: false })
    leido: boolean;

    @Column({ type: 'text', nullable: true })
    respuesta: string;

    @Column({ nullable: true })
    fechaRespuesta: Date;

    @Column({ default: false })
    eliminadoPorStaff: boolean;

    @Column({ default: false })
    eliminadoPorCliente: boolean;

    @ManyToOne(() => Cliente, { eager: true, nullable: false })
    @JoinColumn({ name: 'cliente_id' })
    cliente: Cliente;

    @ManyToOne(() => Usuario, { eager: true, nullable: true })
    @JoinColumn({ name: 'respondido_por_usuario_id' })
    respondidoPor: Usuario;

    @OneToMany(() => MensajeReply, (reply) => reply.mensaje, { cascade: true })
    replies: MensajeReply[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}