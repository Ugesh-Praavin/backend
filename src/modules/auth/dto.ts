export class RegisterDto {
  userName: string;
  password: string;
  bio: string;
  customUid?: string;
}

export class LoginDto {
  userName: string;
  password: string;
}