import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID, IsISO8601 } from 'class-validator';

export class CreateBloqueoDto {

    @IsNotEmpty() @IsISO8601() fechaInicio: string; 
    @IsNotEmpty() @IsISO8601() fechaFin: string; 
    @IsString() @IsNotEmpty() motivo: string;
    @IsOptional() @IsBoolean() esGeneral?: boolean;
    @IsOptional() @IsUUID() barberoId?: string;
}