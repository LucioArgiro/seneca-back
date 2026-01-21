import { IsString, IsUUID, IsISO8601, IsNotEmpty } from 'class-validator';

export class CreateTurnoDto {
  @IsISO8601() 
  @IsNotEmpty()
  fecha: string;
  
  @IsUUID()
  @IsNotEmpty()
  barberoId: string;

  @IsUUID()
  @IsNotEmpty()
  servicioId: string;
}