import { Elysia, t } from "elysia";
import { mkdir } from "fs/promises";
import { authGuard } from "../auth-guard";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ["image/", "video/", "application/pdf", "text/plain"];

function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some(p => mime.startsWith(p));
}

export const uploadRoutes = new Elysia()
  .use(authGuard)
  .post("/upload", async ({ body: { file }, request, userId, set }) => {
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: "File too large. Max 50MB." }), { status: 413 });
    }
    if (!isAllowedMime(file.type)) {
      set.status = 400;
      return { error: "File type not allowed. Images, videos, PDFs, and text files only." };
    }
    if (!userId) {
      set.status = 401;
      return { error: "Authentication required" };
    }
    await mkdir("public/uploads", { recursive: true });
    const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
    const filename = `${Date.now()}.${ext}`;
    await Bun.write(`public/uploads/${filename}`, file);
    const baseUrl = process.env.PUBLIC_URL || `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host") || new URL(request.url).host}`;
    return { url: `${baseUrl}/uploads/${filename}` };
  }, {
    body: t.Object({
      file: t.File()
    })
  })
  .get("/uploads/:filename", ({ params: { filename }, set }) => {
    const safe = filename.replace(/\.\.\//g, "").replace(/[<>"|?*]/g, "");
    set.headers["Content-Security-Policy"] = "default-src 'none'; img-src 'self'; media-src 'self'";
    set.headers["Cache-Control"] = "public, max-age=31536000, immutable";
    return Bun.file(`public/uploads/${safe}`);
  });
