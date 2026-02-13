import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class UpdateNegocioDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    direccion?: string;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;
    
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    instagram?: string;

    @IsString()
    @IsOptional()
    horarios?: string;

    @IsString()
    @IsOptional()
    mapsUrl?: string;

    @IsBoolean()
    @IsOptional()
    abierto?: boolean;
}