import { Transform } from "class-transformer";

export const toNumber = () =>
  Transform(({ value }) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  });

export const toBoolean = () =>
  Transform(({ value }) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "boolean") return value;
    const v = String(value).toLowerCase().trim();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
    return undefined;
  });

export const toDate = () =>
  Transform(({ value }) => {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(+d) ? undefined : d;
  });
