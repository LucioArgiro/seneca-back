import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateMensajeDto {
    @IsNotEmpty({ message: 'El contenido no puede estar vacío' })
    @IsString()
    @MinLength(5, { message: 'El mensaje es muy corto (mínimo 5 caracteres)' })
    @MaxLength(1000, { message: 'El mensaje es muy largo (máximo 1000 caracteres)' })
    contenido: string;
}