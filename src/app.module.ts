import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Módulos de la App
import { UsuariosModule } from './usuario/usuario.module';
import { ServiciosModule } from './servicio/servicio.module';
import { TurnosModule } from './turno/turno.module';
import { AuthModule } from './auth/auth.module';
import { ResenasModule } from './resenas/resenas.module';
import { BarberosModule } from './barberos/barberos.module';
import { PagosModule } from './pagos/pagos.module';
import { ClientesModule } from './clientes/clientes.module';
import { FilesModule } from './files/files.module';
import { AgendaModule } from './agenda/agenda.module';
import { CajaModule } from './caja/caja.module';
import { NegocioModule } from './negocio/negocio.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // 👇 1. AJUSTE DE RATE LIMIT (10 era muy poco, lo subí a 100 para evitar errores 429)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // 2. Conexión a BD
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'), // TypeORM maneja el parseo si viene como string
        username: config.get<string>('DB_USERNAME') || config.get<string>('DB_USER'), // Soporte para ambos nombres
        password: config.get<string>('DB_PASSWORD') || config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        timezone: 'Z',
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNC') === 'true' || config.get<string>('NODE_ENV') !== 'production',

        ssl: {
          rejectUnauthorized: false, // Necesario para Railway
        },
      }),
    }),

    ScheduleModule.forRoot(),

    // Módulos de Funcionalidad
    UsuariosModule,
    ServiciosModule,
    TurnosModule,
    AuthModule,
    ResenasModule,
    BarberosModule,
    PagosModule,
    ClientesModule,
    FilesModule,
    AgendaModule,
    CajaModule,
    NegocioModule,
    DashboardModule
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }