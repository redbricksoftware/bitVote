import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { initConfigWithValidation } from './shared/config/appConfig';

async function bootstrap() {
  const cfg = initConfigWithValidation();

  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: true,
    methods: 'GET,POST,PATCH,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableVersioning({ type: VersioningType.URI });

  if (cfg.runtime.isLocal) {
    const swaggerConfig = new DocumentBuilder().setTitle('BitVote API').setDescription('Pairwise comparison ranking system').setVersion('1.0').addBearerAuth().build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(cfg.runtime.appPort);
  console.log(`BitVote running on port ${cfg.runtime.appPort}`);
}

bootstrap();
