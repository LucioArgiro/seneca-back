import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Turno } from '../../turno/entities/turno.entity';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  nombre: string; 

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column('int') 
  duracionMinutos: number; 

  @Column('bool', { default: true })
  activo: boolean;

  @Column('bool', {default: false})
  popular: boolean;

  @Column('text', {nullable: true})
  features: string;
  
  @OneToMany(()=> Turno, (turno)=> turno.servicio)
  turnos: Turno[];
}