import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Resena } from '../../resenas/entities/resena.entity'; // Asegúrate de importar esto

import { HorarioBarbero } from './horario-barbero.entity';
import { BloqueoAgenda } from '../../agenda/entities/bloqueo-agenda.entity';


@Entity('barberos')
export class Barbero {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn()
    usuario: Usuario;

    @Column({ nullable: true })
    dni: string;

    @Column({ nullable: true })
    edad: number;

    @Column({ nullable: true })
    sexo: string;

    @Column({ nullable: true })
    biografia: string;

    @Column({ nullable: true })
    especialidad: string;

    @Column({ nullable: true })
    telefono: string;

    @Column({ nullable: true })
    provincia: string;

    @Column({ nullable: true })
    pais: string;

    @Column({ nullable: true })
    fotoUrl: string;

    @Column({ default: true })
    activo: boolean;

    @OneToMany(() => Resena, (resena) => resena.barbero)
    resenasRecibidas: Resena[];

    @OneToMany(() => HorarioBarbero, (horario) => horario.barbero, {
        cascade: true,
        eager: true
    })
    horarios: HorarioBarbero[];

    @OneToMany(() => BloqueoAgenda, (bloqueo) => bloqueo.barbero)
    bloqueos: BloqueoAgenda[];
}