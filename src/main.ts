import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'; // 1. Importar Helmet

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Seguridad HTTP Headers
  app.use(helmet());

  // 2. Manejo de Cookies
  app.use(cookieParser());

  // 3. CORS Seguro
  app.enableCors({
    origin: [
      'http://localhost:5173', 
      'http://localhost:3000',
      'https://n72j4rmn-5173.brs.devtunnels.ms', 
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  // 4. Validación Estricta de Datos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Esto evita que inyecten campos basura
      transform: true,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();