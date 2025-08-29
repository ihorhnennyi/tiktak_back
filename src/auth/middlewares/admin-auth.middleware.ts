import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { AuthService } from "../auth.services";

@Injectable()
export class AdminAuthMiddleware implements NestMiddleware {
  constructor(private readonly auth: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const legacyCookie = req.cookies?.["aid"];
    const token = bearer || legacyCookie;

    if (!token) return res.redirect("/login");

    const payload = await this.auth.verifyAccess(token);
    if (!payload) return res.redirect("/login");

    (req as any).user = { id: payload.sub, email: payload.email };
    next();
  }
}
