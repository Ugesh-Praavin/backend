import { IsString } from "class-validator";

export class RegisterDto {
  userName: string;
  password: string;
  customUid?: string;
}

export class LoginDto {
  userName: string;
  password: string;
}

export class LogoutDto {
  @IsString()
  token: string;
}
