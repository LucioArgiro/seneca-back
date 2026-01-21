import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Barbero } from './barbero.entity';

@Entity()
export class HorarioBarbero {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    diaSemana: number; 

    @Column({ type: 'time' })
    horaInicio: string; 

    @Column({ type: 'time' })
    horaFin: string;   

    // Relación con Barbero: Si se borra el barbero, se borran sus horarios
    @ManyToOne(() => Barbero, (barbero) => barbero.horarios, { onDelete: 'CASCADE' })
    barbero: Barbero;
}