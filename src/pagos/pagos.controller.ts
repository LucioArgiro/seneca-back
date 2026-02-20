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
      this.pagosService.procesarPagoExitoso(paymentId);
    }

    return { status: 'received' };
  }
}