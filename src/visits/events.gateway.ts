import { Injectable, Logger } from "@nestjs/common";
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { VisitsService } from "./visits.service";

type AdminMessageType = "text" | "block-mode" | "set-block";

interface ClientInfo {
  socketId: string;
  ip: string;
  siteId: string;
}

const SITE_ROOM = (siteId: string) => `site:${siteId}`;
const SITE_IP_ROOM = (siteId: string, ip: string) => `site:${siteId}:ip:${ip}`;
const DEFAULT_SITE = "default";

function parseWsOrigins() {
  const list = (process.env.WS_CORS_ORIGINS || process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : [/^http:\/\/localhost:\d+$/];
}

@Injectable()
@WebSocketGateway({ cors: { origin: parseWsOrigins(), credentials: false } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly autoBlockMs = Number(process.env.AUTO_BLOCK_MS ?? 5000);

  /** Активные клиенты по socketId */
  private clientsBySocket = new Map<string, ClientInfo>();
  /** Таймеры автоблокировки по socketId */
  private timers = new Map<string, NodeJS.Timeout>();
  /** Сокеты, по которым админ уже принял ручное решение (on/off) —
   *  автотаймеры для них игнорируются и гасятся */
  private decided = new Set<string>();

  constructor(private readonly visitsService: VisitsService) {}

  /* ===================== lifecycle ===================== */

  async handleConnection(client: Socket) {
    const socketId = client.id;
    const ip = this.extractClientIp(client);
    const siteId = this.extractSiteId(client) || DEFAULT_SITE;

    await client.join(SITE_ROOM(siteId));
    await client.join(SITE_IP_ROOM(siteId, ip));

    this.clientsBySocket.set(socketId, { socketId, ip, siteId });
    this.logger.log(`[Connected] ${socketId} from ${ip} (site=${siteId})`);

    // Трек визита (минимальный набор)
    await this.visitsService.trackVisit({ ip, socketId } as any);

    // Если визит уже заблокирован — включаем режим сразу
    const visit = await this.visitsService.getByIp(ip);
    if (visit?.isBlocked) {
      this.safeEmit(socketId, "admin-message", {
        type: "block-mode",
        text: "on",
      });
      this.logger.log(
        `[Auto-blocked] immediate ${socketId} (IP: ${ip}, site=${siteId})`
      );
      // НЕ помечаем decided — это не ручное решение
      return;
    }

    // Стартуем автоблокировку, если включена и нет ручного решения
    this.clearTimer(socketId);
    if (this.autoBlockMs > 0 && !this.decided.has(socketId)) {
      const t = setTimeout(async () => {
        try {
          // сокет всё ещё жив?
          if (!this.server.sockets.sockets.has(socketId)) return;
          // админ уже решил? выходим
          if (this.decided.has(socketId)) return;

          const fresh = await this.visitsService.getByIp(ip);
          if (!fresh?.isBlocked) {
            await this.visitsService.setBlockState(socketId, true);
            this.safeEmit(socketId, "admin-message", {
              type: "block-mode",
              text: "on",
            });
            this.logger.log(
              `[Auto-blocked] after ${this.autoBlockMs}ms ${socketId} (IP: ${ip}, site=${siteId})`
            );
          }
        } catch (e) {
          this.logger.error(`Auto-block timer error for ${socketId}: ${e}`);
        } finally {
          this.clearTimer(socketId);
        }
      }, this.autoBlockMs);

      this.timers.set(socketId, t);
    }
  }

  handleDisconnect(client: Socket) {
    const socketId = client.id;
    const info = this.clientsBySocket.get(socketId);
    this.clientsBySocket.delete(socketId);
    this.clearTimer(socketId);
    this.decided.delete(socketId); // забываем ручное решение после дисконнекта
    this.logger.log(
      `[Disconnected] ${socketId}${
        info ? ` (IP: ${info.ip}, site=${info.siteId})` : ""
      }`
    );
  }

  /* ===================== simple ping ===================== */

  @SubscribeMessage("ping")
  handlePing(@MessageBody() _data: any) {
    return { message: "pong" };
  }

  /* ===================== admin sends ===================== */

  /** Отправка в комнату "site + ip" (множеству сокетов на этом сайте с данным ip) */
  sendMessageToIpForSite(
    siteId: string,
    ip: string,
    message: string,
    type: AdminMessageType = "text"
  ) {
    const room = SITE_IP_ROOM(siteId, ip);
    this.server.to(room).emit("admin-message", { type, text: message });

    const localCount = [...this.clientsBySocket.values()].filter(
      (c) => c.siteId === siteId && c.ip === ip
    ).length;

    this.logger.log(
      `[Admin → ${room}] (${localCount} local sockets): ${type} "${message}"`
    );
  }

  /** Отправка по IP на default-сайте */
  sendMessageToIp(
    ip: string,
    message: string,
    type: AdminMessageType = "text"
  ) {
    this.sendMessageToIpForSite(DEFAULT_SITE, ip, message, type);
  }

  /** Отправка на конкретный socketId */
  async sendMessageToSocketId(
    socketId: string,
    message: string,
    type: AdminMessageType = "text"
  ) {
    this.safeEmit(socketId, "admin-message", { type, text: message });
    this.logger.log(`[Admin → Socket] ${socketId}: ${type} "${message}"`);

    if (type === "set-block") {
      const isBlocked = message === "true";
      await this.visitsService.setBlockState(socketId, isBlocked);
      this.logger.log(`[DB] isBlocked=${isBlocked} for ${socketId}`);

      // Ручное решение: навсегда гасим автотаймер для этого сокета
      this.stopAutoBlockForSocket(socketId);

      this.safeEmit(socketId, "admin-message", {
        type: "block-mode",
        text: isBlocked ? "on" : "off",
      });
    }
  }

  /* ===================== helpers (public API for controllers) ===================== */

  /** Остановить автотаймер(ы) и зафиксировать ручное решение для всех сокетов IP */
  stopAutoBlockForIp(ip: string) {
    for (const { socketId, ip: cip } of this.clientsBySocket.values()) {
      if (cip === ip) {
        this.decided.add(socketId);
        this.clearTimer(socketId);
      }
    }
  }

  /** Остановить автотаймер и зафиксировать ручное решение для одного сокета */
  stopAutoBlockForSocket(socketId: string) {
    this.decided.add(socketId);
    this.clearTimer(socketId);
  }

  /* ===================== private utils ===================== */

  private safeEmit(socketId: string, event: string, payload: any) {
    if (!this.server?.sockets?.sockets?.has(socketId)) {
      this.logger.warn(`[Emit skipped] socket not found: ${socketId}`);
      return;
    }
    this.server.to(socketId).emit(event, payload);
  }

  private clearTimer(socketId: string) {
    const t = this.timers.get(socketId);
    if (t) clearTimeout(t);
    this.timers.delete(socketId);
  }

  private extractClientIp(client: Socket): string {
    const xf: string | string[] | undefined =
      (client.handshake.headers["x-forwarded-for"] as any) ?? undefined;

    const raw = Array.isArray(xf)
      ? xf[0]
      : typeof xf === "string"
      ? xf
      : client.handshake.address || "";

    const first = (raw.split(",")[0] ?? "").trim();
    if (!first) return "Unknown";
    if (first === "::1") return "127.0.0.1";
    if (first.startsWith("::ffff:")) return first.slice("::ffff:".length);
    return first;
  }

  private extractSiteId(client: Socket): string | undefined {
    const authSite = (client.handshake.auth?.siteId as string) || "";
    if (authSite) return String(authSite).trim();

    const origin = (client.handshake.headers["origin"] as string) || "";
    const referer = (client.handshake.headers["referer"] as string) || "";

    try {
      if (origin) return new URL(origin).host;
      if (referer) return new URL(referer).host;
    } catch {
      // noop
    }
    return undefined;
  }
}
