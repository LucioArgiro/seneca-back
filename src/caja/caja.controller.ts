// 👇 AGREGAMOS: Res, Query y Response (de express)
import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException, Param, Res, Query } from '@nestjs/common';
import { type Response } from 'express';
import { CajaService } from './caja.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TipoMovimiento, ConceptoMovimiento } from './entities/movimiento-caja.entity';

@Controller('caja')
@UseGuards(JwtAuthGuard)
export class CajaController {
  constructor(private readonly cajaService: CajaService) { }

  // A. Obtener MI Caja (Para el Barbero logueado)
  @Get('me')
  async getMiCaja(@Request() req) {
    const userId = req.user.id;
    return this.cajaService.obtenerResumenCaja(userId);
  }

  // B. Obtener Caja Central (Solo Admin)
  @Get('central')
  async getCajaCentral(@Request() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Acceso denegado');
    return this.cajaService.obtenerResumenCaja(null);
  }

  // C. (Admin) Ver resumen de todas las cajas (Dashboard Financiero)
  @Get('admin/all')
  async getAllCajas(@Request() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Acceso denegado');
    return this.cajaService.obtenerTodasLasCajas();
  }

  @Get('exportar')
  async exportarExcel(
    @Query('cajaId') cajaId: string,
    @Query('mes') mes: number,
    @Query('anio') anio: number,
    @Res() res: Response
  ) {
    // 1. Generamos el archivo usando el servicio
    const buffer = await this.cajaService.generarExcelMensual(cajaId, Number(mes), Number(anio));

    // 2. Configuramos los headers para descarga
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Reporte_Caja_${mes}_${anio}.xlsx`,
      'Content-Length': buffer.byteLength,
    });

    // 3. Enviamos el binario
    res.send(buffer);
  }
  // 👆👆 FIN NUEVO ENDPOINT 👆👆

  // D. Registrar un Gasto o Retiro Manual
  @Post('movimiento')
  async crearMovimiento(@Request() req, @Body() body: any) {
    const userId = req.user.role === 'ADMIN' && body.esCentral ? null : req.user.id;

    return this.cajaService.registrarMovimientoManual(
      userId,
      body.tipo,      // INGRESO o EGRESO
      body.concepto,  // GASTO_FIJO, RETIRO, etc.
      body.monto,
      body.descripcion
    );
  }

  // F. Obtener caja de un usuario específico (Admin)
  @Get('admin/:userId')
  async getCajaDeUsuario(@Request() req, @Param('userId') userId: string) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Acceso denegado');
    return this.cajaService.obtenerResumenCaja(userId);
  }

}