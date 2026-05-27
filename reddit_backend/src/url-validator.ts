import { URL } from "url";

const BLOCKED_HOSTS = new Set([
  "localhost", "127.0.0.1", "0.0.0.0", "::1",
  "169.254.169.254", "metadata.google.internal",
]);

const BLOCKED_RANGES = [
  /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^127\./, /^0\./,
];

const ALLOWED_PROTOCOLS = ["http:", "https:"];

export function isValidUrl(input: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return false;
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return false;

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname)) return false;

  if (BLOCKED_RANGES.some(r => r.test(hostname))) return false;

  if (parsed.port) {
    const p = parseInt(parsed.port, 10);
    if (p < 1024 || p === 5433 || p === 5432 || p === 6379 || p === 27017) return false;
  }

  return true;
}
