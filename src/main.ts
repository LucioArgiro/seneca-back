import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Seguridad básica
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
  }));

  app.use(cookieParser());

  // 2. CORS DINÁMICO (La solución robusta)
  // Definimos quiénes son los amigos permitidos
  const whitelist = [
    'http://localhost:5173', 
    'https://n72j4rmn-5173.brs.devtunnels.ms', // Tu Frontend
    'https://ricki-subglacial-shenna.ngrok-free.app' // Tu Backend (por si acaso)
  ];

  app.enableCors({
    origin: function (origin, callback) {

      if (!origin) return callback(null, true);
      if (whitelist.includes(origin) || whitelist.some(w => origin.includes('devtunnels.ms'))) {
        callback(null, true);
      } else {

        console.log(`⛔ Bloqueado por CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Vital para cookies
    allowedHeaders: 'Content-Type, Authorization, Accept, ngrok-skip-browser-warning', // Headers explícitos
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();