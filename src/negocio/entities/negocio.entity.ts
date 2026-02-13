import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('negocio')
export class Negocio {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    nombre: string;

    @Column('text', { nullable: true })
    logoUrl: string;

    @Column('text', { nullable: true })
    direccion: string;

    @Column('text', { nullable: true })
    telefono: string;

    @Column('text', { nullable: true })
    email: string;

    @Column('text', { nullable: true })
    instagram: string;

    @Column('simple-array', { nullable: true })
    galeria: string[];

    @Column('text', { nullable: true })
    horarios: string;

    @Column('text', { nullable: true })
    mapsUrl: string;

    @Column('boolean', { default: true })
    abierto: boolean;
}