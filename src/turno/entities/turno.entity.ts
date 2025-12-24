import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, CreateDateColumn } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Servicio } from '../../servicio/entities/servicio.entity';

export enum EstadoTurno {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO',
}

@Entity('turnos')
// Mantenemos el unique para evitar duplicados exactos, aunque nuestra validación por código será más potente.
@Unique(['barbero', 'fecha']) 
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, { eager: true }) 
  @JoinColumn({ name: 'cliente_id' })
  cliente: Usuario;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'barbero_id' })
  barbero: Usuario;

  @ManyToOne(() => Servicio, { eager: true })
  @JoinColumn({ name: 'servicio_id' })
  servicio: Servicio;

  // INICIO DEL TURNO
  @Column('datetime')
  fecha: Date;

  @Column('datetime')
  fechaFin: Date;

  @Column({
    type: 'enum',
    enum: EstadoTurno,
    default: EstadoTurno.PENDIENTE,
  })
  estado: EstadoTurno;

  @Column('text', { nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;
}