import { Elysia, t } from "elysia";
import { db } from "../db";

export const subredditRoutes = new Elysia({ prefix: "/subreddits" })
  .get("/", async () => {
    return await db.subreddit.findMany({
      include: {
        _count: { select: { posts: true } }
      },
      orderBy: { posts: { _count: "desc" } }
    });
  })

  .get("/:name", async ({ params: { name }, set }) => {
    const subreddit = await db.subreddit.findUnique({
      where: { name },
      include: {
        _count: { select: { posts: true } },
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
      return { success: true };
    } catch (e) {
      console.error(e);
      set.status = 500; return { error: "Could not delete community" };
    }
  });
