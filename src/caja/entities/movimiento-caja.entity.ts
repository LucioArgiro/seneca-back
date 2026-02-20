import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Caja } from './caja.entity';
import { Turno } from '../../turno/entities/turno.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';


export enum TipoMovimiento {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
}

export enum ConceptoMovimiento {
  COBRO_TURNO = 'COBRO_TURNO',
  PAGO_TOTAL_WEB = 'PAGO_TOTAL_WEB', 
  SENA_WEB = 'SENA_WEB',      
  GASTO_FIJO = 'GASTO_FIJO',   
  RETIRO = 'RETIRO',         
  AJUSTE = 'AJUSTE',
  INSUMOS = 'INSUMOS',
  OTRO = 'OTRO'
}

@Entity('movimientos_caja')
export class MovimientoCaja {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @ManyToOne(() => Caja, (caja) => caja.movimientos)
  @JoinColumn({ name: 'caja_id' })
  caja: Caja;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario; // Quién generó/recibió este movimiento

  @Column({ type: 'enum', enum: TipoMovimiento })
  tipo: TipoMovimiento;

  @Column({ type: 'enum', enum: ConceptoMovimiento })
  concepto: ConceptoMovimiento;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'varchar', length: 50 })
  metodoPago: string; // 'EFECTIVO', 'TRANSFERENCIA', 'MERCADOPAGO', etc.

  @Column({ type: 'text', nullable: true })
  descripcion: string; // Ej: "Corte fade a Juan Perez"

  // 👇 Opcional: Para saber de qué turno vino este dinero
  @ManyToOne(() => Turno, { nullable: true })
  @JoinColumn({ name: 'turno_id' })
  turno: Turno;

  @CreateDateColumn()
  fecha: Date;
}