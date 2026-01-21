import { IsString, IsEmail, MinLength, IsNumber, IsNotEmpty, IsOptional, Matches, IsArray, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHorarioDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'La hora debe ser formato HH:mm' })
  horaInicio: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'La hora debe ser formato HH:mm' })
  horaFin: string;
}

export class CreateBarberoDto {
  @IsString()
  nombre: string;
  
  @IsString()
  apellido: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
    {
      message: 'La contraseña necesita: 1 Mayúscula, 1 Minúscula, 1 Número y 1 Símbolo (ej: @, _, -, ;)'
    }
  )
  password: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsNumber()
  @IsNotEmpty()
  edad: number;

  @IsString()
  @IsNotEmpty()
  sexo: string;

  @IsOptional()
  @IsString()
  biografia?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;

  // 👇 NUEVO: Array de horarios opcional al crear
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // Valida cada objeto dentro del array
  @Type(() => CreateHorarioDto)   // Convierte el JSON a la clase CreateHorarioDto
  horarios?: CreateHorarioDto[];
}