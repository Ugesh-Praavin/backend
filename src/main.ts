import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { constrainedMemory } from "process";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); 
  await app.listen(5000, "0.0.0.0"); 
  console.log("Server is running on http://localhost:5000");
}

bootstrap();