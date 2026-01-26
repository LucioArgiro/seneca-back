export class RegistroPagoDto {
  paymentId: string;
  monto: number;
  montoNeto: number;
  estado: string;
  tipoPago: string;
  marcaTarjeta?: string;
  turnoId: string; // Para buscar el turno y conectarlo
}