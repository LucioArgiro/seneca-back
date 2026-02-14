export class DashboardStatsDto {
  kpis: {
    ingresosTotales: number; // Suma de turnos completados o movimientos
    turnosCompletados: number;
    clientesNuevos: number;
    tasaCancelacion: number; // Porcentaje
  };
  graficoIngresos: {
    fecha: string;
    total: number;
  }[];
  proximosTurnos: any[];
  topBarberos?: { // Solo para Admin
    nombre: string;
    turnos: number;
    ingresos: number;
  }[];
}