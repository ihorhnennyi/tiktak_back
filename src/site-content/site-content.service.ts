import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, UpdateQuery } from "mongoose";
import { LocalePage, LocalePageDocument } from "./schemas/locale-page.schema";

type PublicPage = Pick<
  LocalePage,
  "locale" | "title" | "textBeforeWallet" | "wallet" | "textAfterWallet"
> & { updatedAt?: Date };

type LocaleListItem = { locale: string; updatedAt: Date };

const ALLOWED_FIELDS: Array<keyof LocalePage> = [
  "title",
  "textBeforeWallet",
  "wallet",
  "textAfterWallet",
];

const PUBLIC_PROJECTION = {
  _id: 0,
  locale: 1,
  title: 1,
  textBeforeWallet: 1,
  wallet: 1,
  textAfterWallet: 1,
  updatedAt: 1,
};

@Injectable()
export class SiteContentService {
  constructor(
    @InjectModel(LocalePage.name)
    private readonly pageModel: Model<LocalePageDocument>
  ) {}

  private sanitizePatch(patch: Partial<LocalePage>): UpdateQuery<LocalePage> {
    const $set: Partial<LocalePage> = {};
    for (const k of ALLOWED_FIELDS) {
      if (patch[k] !== undefined) {
        const v = patch[k];
        $set[k] = typeof v === "string" ? (v as string).trim() : (v as any);
      }
    }
    return { $set };
  }

  async createPage(dto: { locale: string } & Partial<LocalePage>) {
    const locale = dto.locale.toLowerCase();
    const exists = await this.pageModel.exists({ locale });
    if (exists) throw new ConflictException("Locale already exists");

    const doc = await this.pageModel.create({
      locale,
      title: dto.title?.trim() ?? "Untitled",
      textBeforeWallet: dto.textBeforeWallet,
      wallet: dto.wallet?.trim(),
      textAfterWallet: dto.textAfterWallet,
      ip: (dto as any).ip,
    });
    return doc.toObject();
  }

  async upsertPage(locale: string, patch: Partial<LocalePage>) {
    const update = this.sanitizePatch(patch);
    (update.$set as any).locale = locale.toLowerCase();
    return this.pageModel
      .findOneAndUpdate({ locale: (update.$set as any).locale }, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })
      .lean()
      .exec();
  }

  async updatePage(locale: string, patch: Partial<LocalePage>) {
    const update = this.sanitizePatch(patch);
    const updated = await this.pageModel
      .findOneAndUpdate({ locale: locale.toLowerCase() }, update, { new: true })
      .lean();
    if (!updated) throw new NotFoundException("Locale not found");
    return updated;
  }

  async deletePage(locale: string) {
    const res = await this.pageModel
      .findOneAndDelete({ locale: locale.toLowerCase() })
      .lean();
    if (!res) throw new NotFoundException("Locale not found");
    return { deleted: true, locale: res.locale };
  }

  async getAdminPage(locale: string) {
    const page = await this.pageModel
      .findOne({ locale: locale.toLowerCase() })
      .lean();
    if (!page) throw new NotFoundException("Locale not found");
    return page;
  }

  async getPublicPage(locale: string): Promise<PublicPage | null> {
    return this.pageModel
      .findOne({ locale: locale.toLowerCase() }, PUBLIC_PROJECTION)
      .lean();
  }

  async listLocales(): Promise<LocaleListItem[]> {
    return this.pageModel
      .find({}, { _id: 0, locale: 1, updatedAt: 1 })
      .sort({ locale: 1 })
      .lean<LocaleListItem[]>();
  }
}
