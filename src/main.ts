import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './common/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
