import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { jwt } from "@elysiajs/jwt";
import { postRoutes } from "./routes/posts";
import { subredditRoutes } from "./routes/subreddits";
import { commentRoutes } from "./routes/comments";
import { authRoutes } from "./routes/auth";
import { reportRoutes } from "./routes/reports";
import { notificationRoutes } from "./routes/notifications";
import { db } from "./db";
import { authGuard } from "./auth-guard";
import { rateLimit } from "./rate-limiter";
import { mkdir } from "fs/promises";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ["image/", "video/", "application/pdf", "text/plain"];

function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some(p => mime.startsWith(p));
}

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET must be set in production.");
    process.exit(1);
  }
  console.warn("WARNING: JWT_SECRET not set. Using insecure fallback.");
}

const app = new Elysia()
  .onRequest(({ request, set }) => {
    const key = request.headers.get("x-forwarded-for") || "global";
    if (!rateLimit(key)) {
      set.status = 429;
      return { error: "Too many requests" };
    }
  })
  .use(cors())
  .use(jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  }))
  .use(authGuard)
  .use(staticPlugin({ assets: "public", prefix: "/" }))
  .onAfterHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
  })
  .get("/", () => ({ status: "DevShare API is running", version: "2.0" }))
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
    return Bun.file(`public/uploads/${safe}`);
  })
  .use(authRoutes)
  .use(postRoutes)
  .use(subredditRoutes)
  .use(commentRoutes)
  .use(reportRoutes)
  .use(notificationRoutes)
  .listen({ port: Number(process.env.PORT) || 3001, hostname: "0.0.0.0" });

db.$connect().then(() => console.log("Database connected"));

console.log(
  `DevShare API is running at ${app.server?.hostname}:${app.server?.port}`
);
