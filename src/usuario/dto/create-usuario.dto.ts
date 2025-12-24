import { IsString, IsEmail, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '../entities/usuario.entity'; // Asegúrate de importar el Enum de tu entidad

export class CreateUsuarioDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 letras' })
  fullname: string;

  @IsEmail({}, { message: 'El formato del email es incorrecto' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;
  @IsEnum(UserRole, { message: 'El rol debe ser CLIENT o BARBER' })
  @IsOptional()
  role?: UserRole;
}