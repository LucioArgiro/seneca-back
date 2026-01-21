import { IsISO8601, IsNotEmpty } from "class-validator";

export class ReprogramarTurnoDto {
  @IsNotEmpty()
  @IsISO8601()
  nuevaFecha: string;
}