import { IsString, IsEmail, MinLength, IsEnum, IsOptional, IsBoolean, Matches } from 'class-validator';
import { UserRole } from '../entities/usuario.entity'; // Asegúrate de importar el Enum de tu entidad

export class CreateUsuarioDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 letras' })
  nombre: string;

  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 letras' })
  apellido: string;

  @IsEmail({}, { message: 'El formato del email es incorrecto' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
    {
      message: 'La contraseña necesita: 1 Mayúscula, 1 Minúscula, 1 Número y 1 Símbolo (ej: @, _, -, ;)'
    }
  )
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  pais?: string;

  @IsString()
  @IsOptional()
  provincia?: string;



  @IsEnum(UserRole, { message: 'El rol debe ser CLIENT o BARBER' })
  @IsOptional()
  role?: UserRole;
}