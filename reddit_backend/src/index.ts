import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
// public dir created
import { staticPlugin } from "@elysiajs/static";
import { postRoutes } from "./routes/posts";
import { subredditRoutes } from "./routes/subreddits";
import { commentRoutes } from "./routes/comments";
import { authRoutes } from "./routes/auth";
import { reportRoutes } from "./routes/reports";
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
    const host = new URL(request.url).origin;
    return { url: `${host}/uploads/${filename}` };
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
  .listen(3001);

console.log(
  `🚀 DevShare API is running at ${app.server?.hostname}:${app.server?.port}`
);
