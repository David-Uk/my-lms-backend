import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('LMS API')
    .setDescription('The Learning Management System API description')
    .setVersion('1.0')
    .addTag('lms')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Update Swagger UI
  SwaggerModule.setup('api', app, document);

  // Generate Swagger JSON file for Postman import
  // This triggers automatically on application bootstrap (restart)
  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  console.log('Swagger JSON generated at ./swagger.json');
}
