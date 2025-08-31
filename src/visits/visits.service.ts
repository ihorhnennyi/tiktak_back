// visits.service.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, UpdateQuery } from "mongoose";
import { GetVisitsQuery } from "./dto/get-visits.query";
import { TrackVisitDto } from "./dto/track-visit.dto";
import { exportVisitsCsv } from "./helpers/export-visits-csv";
import { Visit, VisitDocument } from "./schemas/visit.schema";
import { definedOnly } from "./utils/definedOnly";

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

  /** Поиск с фильтрами и курсором */
  async findMany(q: GetVisitsQuery) {
    const filter: FilterQuery<Visit> = {};

    if (q.ip) filter.ip = q.ip;
    if (q.from || q.to) filter.lastVisit = {};
    if (q.from) (filter.lastVisit as any).$gte = q.from;
    if (q.to) (filter.lastVisit as any).$lte = q.to;
    if (q.cursor)
      filter.lastVisit = { ...(filter.lastVisit || {}), $lt: q.cursor };

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

  /** Экспорт CSV (учитывает те же фильтры, до 10k строк) */
  async exportCsv(q: GetVisitsQuery) {
    const { items } = await this.findMany({ ...q, limit: 10000 });
    return exportVisitsCsv(items);
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

  async setBlockStateByIp(ip: string, isBlocked: boolean) {
    if (!ip) return { matched: 0, modified: 0 };
    const res = await this.visitModel.updateMany(
      { ip },
      { $set: { isBlocked } }
    );
    const modified = (res as any).modifiedCount ?? (res as any).nModified ?? 0;
    const matched = (res as any).matchedCount ?? (res as any).n ?? 0;
    return { matched, modified };
  }

  async setBlockStateByIps(ips: string[], isBlocked: boolean) {
    if (!Array.isArray(ips) || ips.length === 0)
      return { matched: 0, modified: 0 };
    const res = await this.visitModel.updateMany(
      { ip: { $in: ips } },
      { $set: { isBlocked } }
    );
    const modified = (res as any).modifiedCount ?? (res as any).nModified ?? 0;
    const matched = (res as any).matchedCount ?? (res as any).n ?? 0;
    return { matched, modified };
  }

  async setBlockStateBySocketIds(socketIds: string[], isBlocked: boolean) {
    if (!Array.isArray(socketIds) || socketIds.length === 0)
      return { matched: 0, modified: 0 };
    const res = await this.visitModel.updateMany(
      { socketId: { $in: socketIds } },
      { $set: { isBlocked } }
    );
    const modified = (res as any).modifiedCount ?? (res as any).nModified ?? 0;
    const matched = (res as any).matchedCount ?? (res as any).n ?? 0;
    return { matched, modified };
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
