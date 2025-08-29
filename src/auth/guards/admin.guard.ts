import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "../auth.services";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!bearer) return false;
    const payload = await this.auth.verifyAccess(bearer);
    if (!payload) return false;
    (req as any).user = { id: payload.sub, email: payload.email };
    return true;
  }
}
