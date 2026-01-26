import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, OneToOne } from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Barbero } from '../../barberos/entities/barbero.entity';
import { Servicio } from '../../servicio/entities/servicio.entity';
import { Pago } from '../../pagos/entities/pago.entity';

export enum EstadoTurno {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO',
}

@Entity('turnos')
@Unique(['barbero', 'fecha'])
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

  @Column({ type: 'timestamp' })
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

  @OneToOne(() => Pago, (pago) => pago.turno, { cascade: true })
  pago: Pago;
}