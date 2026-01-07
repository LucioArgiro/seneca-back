import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique, JoinColumn } from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity'; // 👈 Ahora importamos Cliente
import { Barbero } from '../../barberos/entities/barbero.entity'; // 👈 Ahora importamos Barbero

@Entity()
// @Unique ahora validará sobre las nuevas columnas
@Unique(['cliente', 'barbero']) 
export class Resena {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  calificacion: number;

  @Column('text')
  comentario: string;

  @CreateDateColumn()
  fecha: Date;

  // --- RELACIONES NUEVAS (LIMPIAS) ---

  // 1. Relación con la tabla CLIENTES
  @ManyToOne(() => Cliente, (cliente) => cliente.resenasRealizadas, { eager: true }) 
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  // 2. Relación con la tabla BARBEROS
  @ManyToOne(() => Barbero, (barbero) => barbero.resenasRecibidas) 
  @JoinColumn({ name: 'barberoId' })
  barbero: Barbero;
}