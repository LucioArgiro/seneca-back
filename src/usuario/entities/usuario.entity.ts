import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
    CLIENT = 'CLIENT',
    BARBER = 'BARBER',
    ADMIN = 'ADMIN'
}

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    fullname: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'text', select: false })
    password: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
    role: UserRole;

    @Column('bool', { default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // NOTA: Ya no ponemos relaciones de reseñas aquí.
}