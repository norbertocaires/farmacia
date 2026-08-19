import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CSP desabilitada porque o Swagger UI (servido na raiz) depende de scripts/estilos
  // inline; o resto dos headers de segurança do helmet continuam ativos.
  app.use(helmet({ contentSecurityPolicy: false }));

  // Remove campos não declarados no DTO (ex.: "id" injetado num body de cadastro)
  // e valida os decorators do class-validator, que antes eram ignorados.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const port = configService.get<number>('PORT') || 3000;

  // Habilita o CORS para o Angular e para apps mobile (sem origin)
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Apps mobile nativos não enviam origin — permitir
      if (!origin) return callback(null, true);
      const allowed = [frontendUrl, 'http://localhost:8081'];
      if (allowed.includes(origin)) return callback(null, true);
      callback(new Error(`CORS bloqueado para origem: ${origin}`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Farmacia API')
    .setDescription('Documentação das rotas do sistema de gerenciamento de medicações')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, document);

  await app.listen(port);
  console.log(`Application is running on: ${await app.getHttpServer().address().port}`);
}
bootstrap();