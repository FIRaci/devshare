import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { postRoutes } from "./routes/posts";
import { subredditRoutes } from "./routes/subreddits";
import { commentRoutes } from "./routes/comments";
import { authRoutes } from "./routes/auth";
import { reportRoutes } from "./routes/reports";
import { notificationRoutes } from "./routes/notifications";
import { db } from "./db";
import { mkdir } from "fs/promises";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({ assets: "public", prefix: "/" }))
  .get("/", () => ({ status: "DevShare API is running", version: "2.0" }))
  .post("/upload", async ({ body: { file }, request }) => {
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: "File too large. Max 50MB." }), { status: 413 });
    }
    await mkdir("public/uploads", { recursive: true });
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}.${ext}`;
    await Bun.write(`public/uploads/${filename}`, file);
    const baseUrl = process.env.PUBLIC_URL || `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host") || new URL(request.url).host}`;
    return { url: `${baseUrl}/uploads/${filename}` };
  }, {
    body: t.Object({
      file: t.File()
    })
  })
  .get("/uploads/:filename", ({ params: { filename } }) => {
    return Bun.file(`public/uploads/${filename}`);
  })
  .use(authRoutes)
  .use(postRoutes)
  .use(subredditRoutes)
  .use(commentRoutes)
  .use(reportRoutes)
  .use(notificationRoutes)
  .listen({ port: Number(process.env.PORT) || 3001, hostname: "0.0.0.0" });

db.$connect().then(() => console.log('Database connected'));

console.log(
  `DevShare API is running at ${app.server?.hostname}:${app.server?.port}`
);
