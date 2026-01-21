import { IsDateString, IsNotEmpty, IsUUID } from "class-validator";

export class GetOcupadosDto {
    @IsNotEmpty()
    @IsDateString()
    fecha: string;

    @IsNotEmpty()
    @IsUUID()
    barberoId: string;
}