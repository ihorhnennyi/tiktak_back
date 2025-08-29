import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { Model } from "mongoose";
import { Admin, AdminDocument } from "./schemas/admin.schema";

type JwtPayload = { sub: string; email: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private readonly jwt: JwtService
  ) {}

  private async signAccess(payload: JwtPayload) {
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    });
  }
  private async signRefresh(payload: JwtPayload) {
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    });
  }

  private async issueTokensAndStoreRefresh(admin: AdminDocument) {
    const payload: JwtPayload = {
      sub: admin._id.toString(),
      email: admin.email,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccess(payload),
      this.signRefresh(payload),
    ]);
    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
    const refreshHash = await bcrypt.hash(refreshToken, rounds);
    await this.adminModel.updateOne(
      { _id: admin._id },
      { $set: { refreshTokenHash: refreshHash } }
    );
    return {
      accessToken,
      refreshToken,
      admin: { id: payload.sub, email: admin.email },
    };
  }

  async validateLogin(login: string, password: string) {
    const email = login.toLowerCase().trim();
    const admin = await this.adminModel.findOne({ email }).select("+password");
    if (!admin?.password) return null;

    const ok = admin.comparePassword
      ? await admin.comparePassword(password)
      : await bcrypt.compare(password, admin.password);
    if (!ok) return null;

    return this.issueTokensAndStoreRefresh(admin);
  }

  async refreshByToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });
      const admin = await this.adminModel
        .findById(payload.sub)
        .select("+refreshTokenHash");
      if (!admin?.refreshTokenHash) return null;
      const valid = await bcrypt.compare(refreshToken, admin.refreshTokenHash);
      if (!valid) return null;
      return this.issueTokensAndStoreRefresh(admin);
    } catch {
      return null;
    }
  }

  async verifyAccess(token: string) {
    try {
      return await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      return null;
    }
  }

  async logout(userId: string) {
    await this.adminModel.updateOne(
      { _id: userId },
      { $unset: { refreshTokenHash: "" } }
    );
  }

  async ensureRootAdmin(force = false) {
    const email = (process.env.ROOT_ADMIN_EMAIL ?? "").toLowerCase().trim();
    const password = process.env.ROOT_ADMIN_PASSWORD ?? "";
    if (!email || !password) {
      this.logger.warn("ROOT_ADMIN_EMAIL/ROOT_ADMIN_PASSWORD not set");
      return { ok: false, reason: "ENV_MISSING" };
    }

    const existing = await this.adminModel
      .findOne({ email })
      .select("_id email");
    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
    const hash = await bcrypt.hash(password, rounds);

    if (existing) {
      if (!force) {
        this.logger.log(`Root admin exists: ${email}`);
        return { ok: true, created: false, email };
      }
      await this.adminModel.updateOne(
        { _id: existing._id },
        { $set: { password: hash } }
      );
      this.logger.log(`Root admin password reset: ${email}`);
      return { ok: true, created: false, reset: true, email };
    }

    await this.adminModel.create({ email, password: hash });
    this.logger.log(`Root admin created: ${email}`);
    return { ok: true, created: true, email };
  }

  async onModuleInit() {
    await this.ensureRootAdmin(false);
  }
}
