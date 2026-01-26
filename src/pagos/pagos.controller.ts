import { Controller, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) { }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async recibirNotificacion(@Body() body: any, @Query('type') type: string) {
    // MP puede mandar el ID en distintos lugares del body dependiendo la versión
    const paymentId = body.data?.id || body.data;
    const topic = type || body.type;

    if (topic === 'payment' && paymentId) {
      console.log(`🔔 Webhook recibido: Pago ${paymentId}`);
      // No usamos await para responder rápido 200 OK a Mercado Pago
      // La lógica corre en segundo plano
      this.pagosService.procesarPagoExitoso(paymentId);
    }

    return { status: 'received' };
  }
}