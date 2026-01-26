import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Turno } from '../../turno/entities/turno.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  paymentId: string; 

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montoNeto: number; 

  @Column({ type: 'varchar', length: 50 })
  estado: string; 

  @Column({ type: 'varchar', length: 50 })
  tipoPago: string;

  @Column({ type: 'varchar', nullable: true })
  marcaTarjeta: string; 

  @CreateDateColumn()
  fechaCreacion: Date; 

  @OneToOne(() => Turno, (turno) => turno.pago)
  @JoinColumn({ name: 'turno_id' })
  turno: Turno;
}