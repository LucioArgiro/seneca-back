import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
// 👇 1. Importamos las herramientas de Rate Limiting
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),

    // 3. Conexión a BD
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        timezone: 'Z',
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        ssl: {
          rejectUnauthorized: false,
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
    NegocioModule
  ],

  // 👇 3. Activamos el Guardián Globalmente
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }