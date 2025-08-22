import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { envConfig } from "./config/env.config";
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: envConfig.CORS_ORIGIN,
    credentials: envConfig.CORS_CREDENTIALS,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  await app.listen(envConfig.PORT, envConfig.HOST); 
  console.log("🚀 Server is running on http://localhost:" + envConfig.PORT);
  console.log("📚 API Documentation: http://localhost:" + envConfig.PORT + "/api");
  console.log("🌍 Environment: " + envConfig.NODE_ENV);
}
bootstrap();