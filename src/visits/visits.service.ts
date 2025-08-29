import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, UpdateQuery } from "mongoose";
import { GetVisitsQuery } from "./dto/get-visits.query";
import { TrackVisitDto } from "./dto/track-visit.dto";
import { Visit, VisitDocument } from "./schemas/visit.schema";

function definedOnly<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  ) as Partial<T>;
}

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>
  ) {}

  async trackVisit(data: TrackVisitDto) {
    const query: FilterQuery<Visit> = { ip: data.ip };
    const set = definedOnly({
      userAgent: data.userAgent,
      lang: data.lang,
      timezone: data.timezone,
      screen: data.screen,
      platform: data.platform,
      referrer: data.referrer,
      memory: data.memory,
      cores: data.cores,
      online: data.online,
      secure: data.secure,
      connectionType: data.connectionType,
      maxTouchPoints: data.maxTouchPoints,
      cookieEnabled: data.cookieEnabled,
      socketId: data.socketId,
    });

    const update: UpdateQuery<Visit> = {
      $inc: { visitsCount: 1 },
      $set: set,
      $setOnInsert: { ip: data.ip, isBlocked: false },
      $currentDate: { lastVisit: true },
    };

    return this.visitModel.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
  }

  /** Старый простой список, если где-то нужен */
  async getAll(): Promise<Visit[]> {
    return this.visitModel
      .find({}, null, { sort: { lastVisit: -1 } })
      .lean()
      .exec();
  }

  /** Новый поиск с фильтрами и курсором */
  async findMany(q: GetVisitsQuery) {
    const filter: FilterQuery<Visit> = {};

    if (q.ip) filter.ip = q.ip;

    if (q.from || q.to) filter.lastVisit = {};
    if (q.from) (filter.lastVisit as any).$gte = q.from;
    if (q.to) (filter.lastVisit as any).$lte = q.to;

    if (q.cursor) {
      filter.lastVisit = { ...(filter.lastVisit || {}), $lt: q.cursor };
    }

    if (q.q) {
      const rx = { $regex: q.q, $options: "i" };
      filter.$or = [
        { userAgent: rx },
        { referrer: rx },
        { platform: rx },
        { connectionType: rx },
      ];
    }

    const limit = Math.min(Math.max(q.limit ?? 50, 1), 200);

    const items = await this.visitModel
      .find(filter, null, { sort: { lastVisit: -1 } })
      .limit(limit)
      .lean()
      .exec();

    const nextCursor =
      items.length === limit ? items[items.length - 1].lastVisit : null;
    return { items, nextCursor };
  }

  async exportCsv(q: GetVisitsQuery) {
    const { items } = await this.findMany({ ...q, limit: 10000 });
    const header = [
      "ip",
      "lastVisit",
      "visitsCount",
      "isBlocked",
      "userAgent",
      "lang",
      "timezone",
      "screen",
      "platform",
      "referrer",
      "memory",
      "cores",
      "online",
      "secure",
      "connectionType",
      "maxTouchPoints",
      "cookieEnabled",
      "socketId",
      "pageId",
      "createdAt",
      "updatedAt",
    ];
    const lines = [header.join(",")];
    const esc = (v: any) => {
      if (v === undefined || v === null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    for (const it of items) {
      lines.push(
        [
          esc(it.ip),
          esc(
            (it as any).lastVisit instanceof Date
              ? (it as any).lastVisit.toISOString()
              : it.lastVisit
          ),
          esc(it.visitsCount),
          esc(it.isBlocked),
          esc(it.userAgent),
          esc(it.lang),
          esc(it.timezone),
          esc(it.screen),
          esc(it.platform),
          esc(it.referrer),
          esc(it.memory),
          esc(it.cores),
          esc(it.online),
          esc(it.secure),
          esc(it.connectionType),
          esc(it.maxTouchPoints),
          esc(it.cookieEnabled),
          esc(it.socketId),
          esc(it.pageId),
          esc((it as any).createdAt),
          esc((it as any).updatedAt),
        ].join(",")
      );
    }
    return lines.join("\n");
  }

  async setBlockState(
    socketId: string,
    isBlocked: boolean
  ): Promise<Visit | null> {
    if (!socketId) return null;
    return this.visitModel.findOneAndUpdate(
      { socketId },
      { $set: { isBlocked } },
      { new: true }
    );
  }

  async saveCookies(socketId: string, cookies: string) {
    if (!socketId) return;
    await this.visitModel.updateOne({ socketId }, { $set: { cookies } });
  }

  async getBySocketId(socketId: string): Promise<Visit | null> {
    if (!socketId) return null;
    return this.visitModel.findOne({ socketId });
  }

  async updateSocketIdByIp(ip: string, socketId: string) {
    if (!ip) return;
    await this.visitModel.updateOne(
      { ip },
      { $set: { socketId }, $currentDate: { lastVisit: true } }
    );
  }

  async getByIp(ip: string): Promise<Visit | null> {
    if (!ip) return null;
    return this.visitModel.findOne({ ip });
  }
}
