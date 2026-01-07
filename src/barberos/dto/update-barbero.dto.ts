import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateBarberoDto {
  @IsOptional()
  @IsString()
  biografia?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  pais?: string;

  @IsOptional()
  @IsUrl()
  fotoUrl?: string;
}