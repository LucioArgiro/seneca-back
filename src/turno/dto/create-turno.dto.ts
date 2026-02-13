import { IsString, IsUUID, IsISO8601, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

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

  // 👇 NUEVO: El monto monetario que el cliente va a pagar AHORA (online)
  // Si es 0 o undefined, asumimos que paga en el local.
  @IsNumber()
  @IsOptional()
  @Min(0)
  montoPagar?: number;

  // 👇 NUEVO (Recomendado): Para saber qué botón tocó ('TOTAL', 'SENIA', 'LOCAL')
  @IsString()
  @IsOptional()
  tipoPago?: string;
}