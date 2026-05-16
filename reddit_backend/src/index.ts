import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
// public dir created
import { staticPlugin } from "@elysiajs/static";
import { postRoutes } from "./routes/posts";
import { subredditRoutes } from "./routes/subreddits";
import { commentRoutes } from "./routes/comments";
import { authRoutes } from "./routes/auth";
import { reportRoutes } from "./routes/reports";
import { notificationRoutes } from "./routes/notifications";
import { mkdir } from "fs/promises";

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({ assets: "public", prefix: "/" }))
  .get("/", () => ({ status: "DevShare API is running", version: "2.0" }))
  .post("/upload", async ({ body: { file }, request }) => {
    await mkdir("public/uploads", { recursive: true });
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}.${ext}`;
    await Bun.write(`public/uploads/${filename}`, file);
    const proto = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(':', '');
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
    return { url: `${proto}://${host}/uploads/${filename}` };
  }, {
    body: t.Object({
      file: t.File()
    })
  })
  .use(authRoutes)
  .use(postRoutes)
  .use(subredditRoutes)
  .use(commentRoutes)
  .use(reportRoutes)
  .use(notificationRoutes)
  .listen(3001);

// Warm up DB connection on startup
db.$connect().then(() => console.log('✅ Database connected'));

console.log(
  `🚀 DevShare API is running at ${app.server?.hostname}:${app.server?.port}`
);
