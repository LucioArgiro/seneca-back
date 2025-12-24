import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsBoolean } from "class-validator";

export class CreateServicioDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre del servicio es obligatorio' })
    nombre: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsNumber()
    @Min(0, { message: 'El precio debe ser un número positivo' })
    precio: number;

    @IsNumber()
    @Min(5, { message: 'La duración mínima es de 5 minuto' })
    duracionMinutos: number;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;

    @IsBoolean()
    @IsOptional()
    popular?: boolean;

    @IsString()
    @IsOptional()
    features?: string;
}