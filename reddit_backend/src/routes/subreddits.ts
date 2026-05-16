import { Elysia, t } from "elysia";
import { db, getCached, setCache, invalidateCache } from "../db";

export const subredditRoutes = new Elysia({ prefix: "/subreddits" })
  .get("/", async () => {
    const cached = getCached<any>('subs:all');
    if (cached) return cached;
    const data = await db.subreddit.findMany({
      include: {
        _count: { select: { posts: true, subscribers: true } }
      },
      orderBy: { posts: { _count: "desc" } }
    });
    setCache('subs:all', data, 30000);
    return data;
  })

  .get("/:name", async ({ params: { name }, set }) => {
    const subreddit = await db.subreddit.findUnique({
      where: { name },
      include: {
        _count: { select: { posts: true, subscribers: true } },
        posts: {
          include: {
            author: { select: { id: true, username: true, karma: true } },
            subreddit: true,
            votes: { select: { type: true, userId: true } },
            _count: { select: { comments: true, votes: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!subreddit) {
      set.status = 404;
      return { error: "Subreddit not found" };
    }
    return subreddit;
  })

  .post("/", async ({ body, set }) => {
    try {
      const subreddit = await db.subreddit.create({
        data: {
          name: body.name,
          description: body.description
        }
      });
      invalidateCache('subs:');
      return subreddit;
    } catch (e) {
      set.status = 400;
      return { error: "Subreddit already exists or invalid" };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 3, maxLength: 21 }),
      description: t.Optional(t.String())
    })
  })

  // DELETE a subreddit (Admin only)
  .delete("/:name", async ({ params: { name }, headers, set }) => {
    const userId = headers["x-user-id"];
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const user = await db.user.findUnique({ where: { id: userId } });
    const sub = await db.subreddit.findUnique({ where: { name } });
    if (!sub || !user) { set.status = 404; return { error: "Not found" }; }

    if (user.role !== "ADMIN") {
      set.status = 403; return { error: "Forbidden" };
    }

    try {
      // Delete associated posts first to avoid foreign key constraints
      await db.post.deleteMany({ where: { subredditId: sub.id } });
      await db.subreddit.delete({ where: { name } });
      invalidateCache('subs:');
      invalidateCache('posts:');
      return { success: true };
    } catch (e) {
      console.error(e);
      set.status = 500; return { error: "Failed to delete" };
    }
  })
  
  // POST join/leave a subreddit
  .post("/:name/join", async ({ params: { name }, headers, set }) => {
    const userId = headers["x-user-id"];
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }

    const user = await db.user.findUnique({ where: { id: userId } });
    const sub = await db.subreddit.findUnique({ where: { name } });
    if (!sub || !user) { set.status = 404; return { error: "Not found" }; }

    try {
      const existing = await db.subscription.findUnique({
        where: { userId_subredditId: { userId, subredditId: sub.id } }
      });

      if (existing) {
        // Leave
        await db.subscription.delete({
          where: { userId_subredditId: { userId, subredditId: sub.id } }
        });
        return { action: "left" };
      } else {
        // Join
        await db.subscription.create({
          data: { userId, subredditId: sub.id }
        });
        return { action: "joined" };
      }
    } catch (e) {
      console.error(e);
      set.status = 500;
      return { error: "Could not change subscription status" };
    }
  });
