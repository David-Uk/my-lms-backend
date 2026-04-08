/**
 * Standalone script to regenerate swagger.json and postman_collection.json
 * without starting the HTTP server.
 *
 * Usage:  npx ts-node -r tsconfig-paths/register src/generate-spec.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './common/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  setupSwagger(app);
  await app.close();
}
bootstrap();
