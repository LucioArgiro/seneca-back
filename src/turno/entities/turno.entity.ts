import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique} from 'typeorm';

// 👇 Asegúrate de que estas rutas sean correctas según tu estructura de carpetas
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Barbero } from '../../barberos/entities/barbero.entity';
import { Servicio } from '../../servicio/entities/servicio.entity'; // A veces la carpeta es 'servicios' (plural)

export enum EstadoTurno {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO', // Opcional, si usas confirmación por email
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO',
}

@Entity('turnos')
@Unique(['barbero', 'fecha']) // Evita duplicados exactos en DB
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => Cliente, { eager: true }) 
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Barbero, { eager: true })
  @JoinColumn({ name: 'barbero_id' })
  barbero: Barbero;

  @ManyToOne(() => Servicio, { eager: true })
  @JoinColumn({ name: 'servicio_id' })
  servicio: Servicio;

  @Column({ type: 'timestamp' }) // 'timestamp' es más estándar en TypeORM que 'datetime', pero ambos funcionan
  fecha: Date;

  @Column({ type: 'timestamp' })
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