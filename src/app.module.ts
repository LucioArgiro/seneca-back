import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UsuariosModule } from './usuario/usuario.module';
import { ServiciosModule } from './servicio/servicio.module';
import { TurnosModule } from './turno/turno.module';
import { AuthModule } from './auth/auth.module';
import { ResenasModule } from './resenas/resenas.module';
import { BarberosModule } from './barberos/barberos.module';
import { MensajesModule } from './mensajes/mensajes.module';
import { PagosModule } from './pagos/pagos.module';
import { ClientesModule } from './clientes/clientes.module';
import { FilesModule } from './files/files.module';
import { AgendaModule } from './agenda/agenda.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: 'Z',
      autoLoadEntities: true,
      synchronize: true, 
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    ScheduleModule.forRoot(),
    UsuariosModule,
    ServiciosModule,
    TurnosModule,
    AuthModule,
    ResenasModule,
    BarberosModule,
    MensajesModule,
    PagosModule,
    ClientesModule,
    FilesModule,
    AgendaModule,
  ],
})
export class AppModule { }