import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Barbero } from '../../barberos/entities/barbero.entity';

@Entity('bloqueos_agenda')
export class BloqueoAgenda {
    @PrimaryGeneratedColumn('uuid')
    id: string;
   
    @Column({ type: 'timestamp' })
    fechaInicio: Date; 

    @Column({ type: 'timestamp' })
    fechaFin: Date; 

    @Column({ default: false })
    esGeneral: boolean;

    @Column({ type: 'text', nullable: true })
    motivo: string;

    @ManyToOne(() => Barbero, { nullable: true, onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'barbero_id' })
    barbero: Barbero | null;

    @CreateDateColumn()
    creadoEn: Date;
}