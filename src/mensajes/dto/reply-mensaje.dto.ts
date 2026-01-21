import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ReplyMensajeDto {
    @IsNotEmpty({ message: 'La respuesta no puede estar vacía' })
    @IsString()
    @MinLength(1)
    respuesta: string;
}