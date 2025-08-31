import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LocalePage, LocalePageDocument } from "./schemas/locale-page.schema";

@Injectable()
export class SiteContentService {
  constructor(
    @InjectModel(LocalePage.name)
    private readonly pageModel: Model<LocalePageDocument>
  ) {}

  async createPage(locale: string, blocks: LocalePage["blocks"], ip?: string) {
    locale = locale.toLowerCase();
    const exists = await this.pageModel.exists({ locale });
    if (exists) throw new ConflictException("Такая локаль уже существует");

    const doc = await this.pageModel.create({ locale, blocks, ip });
    return doc.toObject();
  }

  async updatePage(locale: string, blocks: LocalePage["blocks"]) {
    locale = locale.toLowerCase();
    const updated = await this.pageModel
      .findOneAndUpdate({ locale }, { $set: { blocks } }, { new: true })
      .lean();

    if (!updated) throw new NotFoundException("Локаль не найдена");
    return updated;
  }

  async deletePage(locale: string) {
    locale = locale.toLowerCase();
    const deleted = await this.pageModel.findOneAndDelete({ locale }).lean();

    if (!deleted) throw new NotFoundException("Локаль не найдена");
    return { deleted: true, locale };
  }

  async getAdminPage(locale: string) {
    const page = await this.pageModel
      .findOne({ locale: locale.toLowerCase() })
      .lean();
    if (!page) throw new NotFoundException("Локаль не найдена");
    return page;
  }

  async getPublicPage(locale: string) {
    return this.pageModel
      .findOne(
        { locale: locale.toLowerCase() },
        { _id: 0, locale: 1, blocks: 1, updatedAt: 1 }
      )
      .lean();
  }

  async listLocales() {
    return this.pageModel
      .find({}, { _id: 0, locale: 1, updatedAt: 1 })
      .sort({ locale: 1 })
      .lean();
  }
}
