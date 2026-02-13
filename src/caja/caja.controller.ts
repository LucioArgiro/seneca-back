import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException, Param } from '@nestjs/common';
import { CajaService } from './caja.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Asegúrate de tener tu Guard de Auth
import { TipoMovimiento, ConceptoMovimiento } from './entities/movimiento-caja.entity';

@Controller('caja')
@UseGuards(JwtAuthGuard) // 👈 Protegemos todo el módulo
export class CajaController {
  constructor(private readonly cajaService: CajaService) { }

  // A. Obtener MI Caja (Para el Barbero logueado)
  @Get('me')
  async getMiCaja(@Request() req) {
    const userId = req.user.id; // Asumiendo que tu JWT trae el ID
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

  // D. Registrar un Gasto o Retiro Manual
  @Post('movimiento')
  async crearMovimiento(@Request() req, @Body() body: any) {
    // body: { tipo: 'EGRESO', concepto: 'GASTO_FIJO', monto: 500, descripcion: 'Luz' }
    const userId = req.user.role === 'ADMIN' && body.esCentral ? null : req.user.id;

    return this.cajaService.registrarMovimientoManual(
      userId,
      body.tipo,      // INGRESO o EGRESO
      body.concepto,  // GASTO_FIJO, RETIRO, etc.
      body.monto,
      body.descripcion
    );
  }
  @Get('admin/:userId')
  async getCajaDeUsuario(@Request() req, @Param('userId') userId: string) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Acceso denegado');
    return this.cajaService.obtenerResumenCaja(userId);
  }
  
}