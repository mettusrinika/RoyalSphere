import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
//import mongoSanitize from 'express-mongo-sanitize';
//import hpp from 'hpp';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ============================
  // Security
  // ============================

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );
// app.use(mongoSanitize());
// app.use(hpp());

  // ============================
  // CORS
  // ============================

   app.enableCors({
  origin: (
    origin,
    callback,
  ) => {
    const allowedOrigins = [
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (
      !origin ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
      return;
    }

    callback(
      new Error(
        `CORS blocked origin: ${origin}`,
      ),
    );
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-refresh-token',
  ],
});

  // ============================
  // Prefix
  // ============================

  app.setGlobalPrefix('api/v1');

  // ============================
  // Validation
  // ============================

  app.useGlobalPipes(
    GlobalValidationPipe,
  );

  // ============================
  // Exception Filter
  // ============================

  app.useGlobalFilters(
    new AllExceptionsFilter(),
  );

  // ============================
  // Response Interceptor
  // ============================

  app.useGlobalInterceptors(
    new TransformInterceptor(),
  );

  // ============================
  // Swagger
  // ============================

  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    const config =
      new DocumentBuilder()
        .setTitle('OMIQORA API')
        .setDescription(
          'AI-powered Services Ecosystem',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document =
      SwaggerModule.createDocument(
        app,
        config,
      );

    SwaggerModule.setup(
      'api/docs',
      app,
      document,
    );
  }

  const port =
    process.env.PORT || 4000;

  await app.listen(port);

  console.log(
    `🚀 OMIQORA API running on http://localhost:${port}/api/v1`,
  );

  console.log(
    `📖 Swagger docs at http://localhost:${port}/api/docs`,
  );
}

bootstrap();