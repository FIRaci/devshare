import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { jwt } from "@elysiajs/jwt";
import { postRoutes } from "./routes/posts";
import { subredditRoutes } from "./routes/subreddits";
import { commentRoutes } from "./routes/comments";
import { authRoutes } from "./routes/auth";
import { reportRoutes } from "./routes/reports";
import { notificationRoutes } from "./routes/notifications";
import { uploadRoutes } from "./routes/upload";
import { db } from "./db";
import { authGuard } from "./auth-guard";
import { rateLimit } from "./rate-limiter";

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomUUID();

// Standard API Group with /api prefix
const apiRouter = new Elysia({ prefix: "/api" })
  .use(authRoutes)
  .use(postRoutes)
  .use(subredditRoutes)
  .use(commentRoutes)
  .use(reportRoutes)
  .use(notificationRoutes)
  .use(uploadRoutes);

const app = new Elysia()
  .onRequest(({ request, set }) => {
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname.startsWith("/uploads/")) return;

    const rawIp = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "127.0.0.1";
    const key = rawIp.split(",")[0].trim() || "global";
    if (!rateLimit(key)) {
      set.status = 429;
      return { error: "Too many requests. Please wait a moment." };
    }
  })
  .use(cors())
  .use(jwt({
    name: "jwt",
    secret: JWT_SECRET,
  }))
  .use(authGuard)
  .use(staticPlugin({ assets: "public", prefix: "/" }))
  .onAfterHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
  })
  .get("/", () => ({ status: "DevShare API is running", version: "2.1", apiDocs: "/api" }))
  // Dual-mount: standard /api prefix + direct routes for complete client compatibility
  .use(apiRouter)
  .use(authRoutes)
  .use(postRoutes)
  .use(subredditRoutes)
  .use(commentRoutes)
  .use(reportRoutes)
  .use(notificationRoutes)
  .use(uploadRoutes)
  .listen({ port: Number(process.env.PORT) || 3001, hostname: "0.0.0.0" });

db.$connect().then(() => console.log("Database connected"));

console.log(
  `DevShare API is running at ${app.server?.hostname}:${app.server?.port}`
);
