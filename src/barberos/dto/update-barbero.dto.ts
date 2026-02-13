import { PartialType } from '@nestjs/mapped-types';
import { CreateBarberoDto, CreateHorarioDto } from './create-barbero.dto';
import { IsOptional, IsString, IsEmail, IsUrl, IsNumber, ValidateIf, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBarberoDto extends PartialType(CreateBarberoDto) {
  @IsOptional() @IsString() biografia?: string;
  @IsOptional() @IsString() especialidad?: string;
  @IsOptional() @IsString() provincia?: string;
  @IsOptional() @IsString() pais?: string;
  @IsOptional() @IsUrl() @ValidateIf((o) => o.fotoUrl !== '') fotoUrl?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() dni?: string;
  @IsOptional() @IsNumber() edad?: number;
  @IsOptional() @IsString() sexo?: string;
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() apellido?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsNumber() precioSenia?: number;
  @IsOptional() @IsString() aliasMp?: string;
  @IsOptional() @IsString() imagenQrUrl?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateHorarioDto) horarios?: CreateHorarioDto[];
}