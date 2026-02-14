import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../usuario/entities/usuario.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  getAdminStats() {
    return this.dashboardService.getAdminStats();
  }

  // Endpoint futuro para el panel del barbero
  // @Get('barber')
  // @Roles(UserRole.BARBER)
  // getBarberStats(@Req() req) {
  //   return this.dashboardService.getBarberStats(req.user.id);
  // }
}