import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { LoginLoggerMiddleware } from './common/middleware/login.middleware';
import { GroupModule } from './modules/group/group.module';


@Module({
  imports: [AuthModule, UserModule, GroupModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoginLoggerMiddleware)
      .forRoutes('auth/login');   
  }
}
