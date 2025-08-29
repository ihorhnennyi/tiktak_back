export function firstForwardedIp(xff?: string | string[]): string | undefined {
  if (!xff) return undefined;
  const raw = Array.isArray(xff) ? xff[0] : xff;
  return raw?.split(",")[0]?.trim();
}

export function normalizeIp(raw?: string): string {
  if (!raw || raw.length === 0) return "Unknown";
  if (raw === "::1") return "127.0.0.1";
  if (raw.startsWith("::ffff:")) return raw.slice("::ffff:".length);
  return raw;
}
