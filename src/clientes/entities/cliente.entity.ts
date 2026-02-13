import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Resena } from '../../resenas/entities/resena.entity';

@Entity('clientes')
export class Cliente {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn()
    usuario: Usuario;

    @Column({ nullable: true }) 
    telefono: string;

    @Column({ nullable: true })
    pais: string;

    @Column({ nullable: true })
    provincia: string;

    @OneToMany(() => Resena, (resena) => resena.cliente)
    resenasRealizadas: Resena[];
}