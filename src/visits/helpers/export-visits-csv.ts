import { Visit } from "../schemas/visit.schema";

function esc(v: any): string {
  if (v === undefined || v === null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportVisitsCsv(items: Visit[]): string {
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

  for (const it of items) {
    lines.push(
      [
        esc(it.ip),
        esc(
          it.lastVisit instanceof Date
            ? it.lastVisit.toISOString()
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
        esc(it.createdAt),
        esc(it.updatedAt),
      ].join(",")
    );
  }

  return lines.join("\n");
}
