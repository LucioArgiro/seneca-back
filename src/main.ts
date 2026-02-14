import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // 2. COOKIES
  app.use(cookieParser());
  const whitelist = [
    'http://localhost:5173',              
    'http://localhost:3000',               
    process.env.FRONTEND_URL,               
    'https://barberiaseneca.com.ar',          
    'https://www.barberiaseneca.com.ar'
  ].filter(Boolean);

  app.enableCors({
    origin: function (origin, callback) {

      if (!origin) {
        return callback(null, true);
      }

      if (whitelist.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`⛔ Bloqueado por CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, 
    allowedHeaders: 'Content-Type, Authorization, Accept',
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


  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`Server running on port ${port}`);
  logger.log(`CORS Whitelist: ${whitelist.join(', ')}`);
}
bootstrap();