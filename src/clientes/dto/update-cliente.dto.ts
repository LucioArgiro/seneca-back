import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateClienteDto {
  @IsOptional()
  @IsString()
  telefono?: string;


}