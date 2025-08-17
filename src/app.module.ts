import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { LoginLoggerMiddleware } from './common/middleware/login.middleware';
import { SessionMiddleware } from './common/middleware/session.middleware';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { GroupModule } from './modules/group/group.module';
import { PostModule } from './modules/post/post.module';

@Module({
  imports: [AuthModule, UserModule, GroupModule, PostModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoginLoggerMiddleware)
      .forRoutes('auth/login')
      .apply(SessionMiddleware)
      .forRoutes('*');
  }
}
