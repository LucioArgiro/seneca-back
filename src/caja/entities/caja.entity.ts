import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { MovimientoCaja } from './movimiento-caja.entity';

@Entity('cajas')
export class Caja {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string; 
  
  @OneToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  saldo: number;

  @OneToMany(() => MovimientoCaja, (mov) => mov.caja)
  movimientos: MovimientoCaja[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creadaEn: Date;
}