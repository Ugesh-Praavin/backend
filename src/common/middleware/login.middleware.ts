import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoginLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.path === "/auth/login" && req.method === "POST") {
      console.log("🟢 Login Attempt:");
      console.log("Body:", req.body);
      console.log("Headers:", req.headers);
    }
    next();
  }
}
