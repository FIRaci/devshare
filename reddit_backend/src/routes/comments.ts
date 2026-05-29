import { Elysia, t } from "elysia";
import { db } from "../db";
import { fetchLinkPreview } from "../utils/link-preview-helper";

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
        author: { select: { id: true, username: true, avatarColor: true, avatarUrl: true } },
        votes: { select: { type: true, userId: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, avatarColor: true, avatarUrl: true } },
            votes: { select: { type: true, userId: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  })

  .post("/", async ({ body, userId, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const post = await db.post.findUnique({ where: { id: body.postId } });
    if (!post) {
      set.status = 400;
      return { error: "Post not found" };
    }

    try {
      let attachments = body.attachments;
      if (attachments !== undefined && Array.isArray(attachments)) {
        attachments = await Promise.all(attachments.map(async (att: any) => {
          if (att.type === 'LINK' && att.url) {
            const preview = await fetchLinkPreview(att.url).catch(() => null);
            return { ...att, linkPreview: preview };
          }
          return att;
        }));
      }

      const comment = await db.comment.create({
        data: {
          content: body.content,
          authorId: userId,
          postId: body.postId,
          parentId: body.parentId ?? null,
          attachments: body.attachments !== undefined ? attachments : undefined,
          mediaUrl: body.attachments !== undefined ? null : undefined,
          mediaType: body.attachments !== undefined ? null : undefined,
        },
        include: {
          author: { select: { id: true, username: true, avatarColor: true, avatarUrl: true } },
          votes: { select: { type: true, userId: true } }
        }
      });

      if (body.parentId) {
        const parentComment = await db.comment.findUnique({ where: { id: body.parentId } });
        if (parentComment && parentComment.authorId !== userId) {
          await db.notification.create({
            data: {
              type: "REPLY_TO_COMMENT",
              userId: parentComment.authorId,
              actorId: userId,
              postId: body.postId,
              commentId: comment.id
            }
          });
        }
      } else {
        if (post.authorId !== userId) {
          await db.notification.create({
            data: {
              type: "COMMENT_ON_POST",
              userId: post.authorId,
              actorId: userId,
              postId: post.id,
              commentId: comment.id
            }
          });
        }
      }

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
      parentId: t.Optional(t.String()),
      attachments: t.Optional(t.Array(t.Any())),
    })
  })

  .post("/:id/vote", async ({ params: { id }, body, userId, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }

    try {
      await db.$transaction(async (tx) => {
        const existing = await tx.vote.findUnique({
          where: { userId_commentId: { userId, commentId: id } }
        });

        if (existing && existing.type === body.type) {
          await tx.vote.delete({ where: { userId_commentId: { userId, commentId: id } } });
          return;
        }

        await tx.vote.upsert({
          where: { userId_commentId: { userId, commentId: id } },
          update: { type: body.type },
          create: { type: body.type, userId, commentId: id }
        });
      });
      return { action: "voted" };
    } catch (e) {
      set.status = 400;
      return { error: "Could not vote" };
    }
  }, {
    body: t.Object({
      type: t.Enum({ UP: "UP", DOWN: "DOWN" })
    })
  })

  .delete("/:id", async ({ params: { id }, userId, userRole, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const comment = await db.comment.findUnique({
      where: { id },
      include: { post: { include: { subreddit: { include: { moderators: { select: { id: true } } } } } } }
    });
    if (!comment) { set.status = 404; return { error: "Not found" }; }

    const isMod = comment.post.subreddit.moderators.some(m => m.id === userId);
    if (comment.authorId !== userId && userRole !== "ADMIN" && !isMod) {
      set.status = 403; return { error: "Forbidden" };
    }

    try {
      await db.comment.delete({ where: { id } });
      return { message: "Deleted" };
    } catch {
      set.status = 500; return { error: "Failed to delete" };
    }
  })

  .patch("/:id", async ({ params: { id }, body, userId, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const comment = await db.comment.findUnique({ where: { id } });
    if (!comment) { set.status = 404; return { error: "Not found" }; }

    if (comment.authorId !== userId) {
      set.status = 403; return { error: "Forbidden" };
    }

    try {
      let attachments = body.attachments;
      if (attachments !== undefined && Array.isArray(attachments)) {
        attachments = await Promise.all(attachments.map(async (att: any) => {
          if (att.type === 'LINK' && att.url) {
            const preview = await fetchLinkPreview(att.url).catch(() => null);
            return { ...att, linkPreview: preview };
          }
          return att;
        }));
      }

      const updated = await db.comment.update({
        where: { id },
        data: {
          content: body.content,
          ...(body.attachments !== undefined ? {
            attachments,
            mediaUrl: null,
            mediaType: null,
          } : {}),
        },
        include: {
          author: { select: { id: true, username: true, avatarColor: true, avatarUrl: true } },
          votes: { select: { type: true, userId: true } }
        }
      });
      return updated;
    } catch {
      set.status = 500; return { error: "Failed to edit" };
    }
  }, {
    body: t.Object({
      content: t.String({ minLength: 1 }),
      attachments: t.Optional(t.Array(t.Any())),
    })
  });
