import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.userName,
      registerDto.password,
      registerDto.customUid,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.userName, loginDto.password);
  }

  @Post('refresh-token')
  async refreshToken(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    const newToken = await this.authService.refreshToken(token);
    return { sessionToken: newToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return {
      uid: req.user.uid,
      userName: req.user.userName,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('streak')
  async getUserStreak(@Request() req) {
    return this.authService.getUserStreak(req.user.uid);
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate-token')
  async validateToken(@Request() req) {
    return {
      valid: true,
      user: {
        uid: req.user.uid,
        userName: req.user.userName,
      },
    };
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    return this.authService.logout(token);
  }
}