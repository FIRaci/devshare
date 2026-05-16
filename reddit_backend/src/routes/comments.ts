import { Elysia, t } from "elysia";
import { db } from "../db";

export const commentRoutes = new Elysia({ prefix: "/comments" })
  // GET comments for a post
  .get("/post/:postId", async ({ params: { postId }, set }) => {
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }
    return await db.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: { select: { id: true, username: true } },
        votes: { select: { type: true, userId: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true } },
            votes: { select: { type: true, userId: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  })

  // POST create a comment
  .post("/", async ({ body, headers, set }) => {
    const userId = headers["x-user-id"];
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      set.status = 401;
      return { error: "User not found" };
    }

    // Verify post exists
    const post = await db.post.findUnique({ where: { id: body.postId } });
    if (!post) {
      set.status = 400;
      return { error: "Post not found" };
    }

    try {
      const comment = await db.comment.create({
        data: {
          content: body.content,
          authorId: user.id,
          postId: body.postId,
          parentId: body.parentId ?? null
        },
        include: {
          author: { select: { id: true, username: true } },
          votes: { select: { type: true, userId: true } }
        }
      });
      return comment;
    } catch (e) {
      console.error(e);
      set.status = 400;
      return { error: "Could not create comment" };
    }
  }, {
    body: t.Object({
      content: t.String({ minLength: 1 }),
      postId: t.String({ minLength: 1 }),
      parentId: t.Optional(t.String())
    })
  })

  // POST vote on a comment
  .post("/:id/vote", async ({ params: { id }, body, headers, set }) => {
    const userId = headers["x-user-id"];
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      set.status = 401;
      return { error: "User not found" };
    }

    try {
      const existing = await db.vote.findUnique({
        where: { userId_commentId: { userId: user.id, commentId: id } }
      });

      if (existing && existing.type === body.type) {
        await db.vote.delete({ where: { userId_commentId: { userId: user.id, commentId: id } } });
        return { action: "removed" };
      }

      const vote = await db.vote.upsert({
        where: { userId_commentId: { userId: user.id, commentId: id } },
        update: { type: body.type },
        create: { type: body.type, userId: user.id, commentId: id }
      });
      return vote;
    } catch (e) {
      set.status = 400;
      return { error: "Could not vote" };
    }
  }, {
    body: t.Object({
      type: t.Enum({ UP: "UP", DOWN: "DOWN" })
    })
  });
