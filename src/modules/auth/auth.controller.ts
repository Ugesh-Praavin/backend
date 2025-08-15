import { Body, Controller, Post } from "@nestjs/common";
import { LoginDto, RegisterDto } from "./dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("register")
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(
            registerDto.userName,
            registerDto.password,
            registerDto.bio,
            registerDto.customUid
        );
    }

    @Post("login")
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(
            loginDto.userName,
            loginDto.password
        );
    }
}