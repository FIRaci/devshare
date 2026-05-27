import { Elysia, t } from "elysia";
import { db, getCached, setCache, invalidateCache } from "../db";

import { fetchLinkPreview } from "../utils/link-preview-helper";

export const postRoutes = new Elysia({ prefix: "/posts" })
  // GET all posts
  .get("/", async () => {
    const cached = getCached<any>('posts:all');
    if (cached) return cached;
    const data = await db.post.findMany({
      include: {
        author: {
          select: { id: true, username: true, karma: true, avatarColor: true, avatarUrl: true }
        },
        subreddit: {
          include: { creator: { select: { id: true, username: true } } }
        },
        _count: {
          select: { comments: true, votes: true }
        },
        votes: {
          select: { type: true, userId: true }
        },
        bookmarks: {
          select: { userId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    setCache('posts:all', data, 10000);
    return data;
  })

  // GET saved/bookmarked posts for current user (before :id to avoid route conflict)
  .get("/saved", async ({ userId, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const bookmarks = await db.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: { select: { id: true, username: true, karma: true, avatarColor: true, avatarUrl: true } },
            subreddit: { include: { creator: { select: { id: true, username: true } } } },
            _count: { select: { comments: true, votes: true } },
            votes: { select: { type: true, userId: true } },
            bookmarks: { select: { userId: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return bookmarks.map(b => b.post);
  })

  // GET single post with full comments tree
  .get("/:id", async ({ params: { id }, set }) => {
    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, karma: true, avatarColor: true, avatarUrl: true }
        },
        subreddit: {
          include: {
            creator: { select: { id: true, username: true } },
            moderators: { select: { id: true } }
          }
        },
        votes: {
          select: { type: true, userId: true }
        },
        bookmarks: { select: { userId: true } },
        _count: { select: { comments: true, votes: true } },
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, username: true, avatarColor: true, avatarUrl: true } },
            votes: { select: { type: true, userId: true } },
            replies: {
              include: {
                author: { select: { id: true, username: true, avatarColor: true, avatarUrl: true } },
                votes: { select: { type: true, userId: true } }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }
    return post;
  })

  // POST create post
  .post("/", async ({ body, userId, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }

    const subreddit = await db.subreddit.findUnique({ where: { id: body.subredditId } });
    if (!subreddit) { set.status = 400; return { error: "Subreddit not found" }; }

    try {
      let linkPreview = null;
      if (body.linkUrl) {
        linkPreview = await fetchLinkPreview(body.linkUrl);
      }

      let attachments = body.attachments ?? null;
      if (attachments && Array.isArray(attachments)) {
        attachments = await Promise.all(attachments.map(async (att: any) => {
          if (att.type === 'LINK' && att.url) {
            const preview = await fetchLinkPreview(att.url).catch(() => null);
            return { ...att, linkPreview: preview };
          }
          return att;
        }));
      }

      const post = await db.post.create({
        data: {
          title: body.title,
          content: body.content,
          authorId: userId,
          subredditId: body.subredditId,
          mediaUrl: body.mediaUrl,
          mediaType: body.mediaType,
          linkPreview: linkPreview ? linkPreview : undefined,
          attachments: attachments ? attachments : undefined,
        } as any,

        include: {
          author: { select: { id: true, username: true, karma: true, avatarColor: true, avatarUrl: true } },
          subreddit: { include: { creator: { select: { id: true, username: true } } } },
          _count: { select: { comments: true, votes: true } },
          votes: { select: { type: true, userId: true } },
          bookmarks: { select: { userId: true } }
        }
      });

      const subscribers = await db.subscription.findMany({
        where: { subredditId: body.subredditId, userId: { not: userId } }
      });
      if (subscribers.length > 0) {
        await db.notification.createMany({
          data: subscribers.map(sub => ({
            type: "POST_IN_SUBREDDIT",
            userId: sub.userId,
            actorId: userId,
            postId: post.id,
            subredditId: body.subredditId
          }))
        });
      }

      invalidateCache('posts:');
      invalidateCache('subs:');
      return post;
    } catch (e) {
      console.error(e);
      set.status = 400;
      return { error: "Could not create post" };
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1 }),
      content: t.Optional(t.String()),
      subredditId: t.String({ minLength: 1 }),
      mediaUrl: t.Optional(t.String()),
      mediaType: t.Optional(t.String()),
      linkUrl: t.Optional(t.String()),
      attachments: t.Optional(t.Array(t.Any())),
    })
  })

  .post("/:id/vote", async ({ params: { id }, body, userId, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }

    try {
      await db.$transaction(async (tx) => {
        const existing = await tx.vote.findUnique({
          where: { userId_postId: { userId, postId: id } }
        });

        if (existing && existing.type === body.type) {
          await tx.vote.delete({ where: { userId_postId: { userId, postId: id } } });
          return;
        }

        await tx.vote.upsert({
          where: { userId_postId: { userId, postId: id } },
          update: { type: body.type },
          create: { type: body.type, userId, postId: id }
        });
      });
      invalidateCache("posts:");
      return { action: "voted" };
    } catch (e) {
      console.error(e);
      set.status = 400;
      return { error: "Could not vote" };
    }
  }, {
    body: t.Object({
      type: t.Enum({ UP: "UP", DOWN: "DOWN" })
    })
  })

  .post("/:id/save", async ({ params: { id }, userId, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const post = await db.post.findUnique({ where: { id } });
    if (!post) { set.status = 404; return { error: "Post not found" }; }

    try {
      const existing = await db.bookmark.findUnique({
        where: { userId_postId: { userId, postId: id } }
      });

      if (existing) {
        await db.bookmark.delete({
          where: { userId_postId: { userId, postId: id } }
        });
        invalidateCache("posts:");
        return { saved: false };
      } else {
        await db.bookmark.create({
          data: { userId, postId: id }
        });
        invalidateCache("posts:");
        return { saved: true };
      }
    } catch (e) {
      console.error(e);
      set.status = 400;
      return { error: "Could not toggle save" };
    }
  })

  .delete("/:id", async ({ params: { id }, userId, userRole, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const post = await db.post.findUnique({
      where: { id },
      include: { subreddit: { include: { moderators: { select: { id: true } } } } }
    });
    if (!post) { set.status = 404; return { error: "Not found" }; }

    const isMod = post.subreddit.moderators.some(m => m.id === userId);
    if (post.authorId !== userId && userRole !== "ADMIN" && !isMod) {
      set.status = 403; return { error: "Forbidden" };
    }

    try {
      await db.post.delete({ where: { id } });
      invalidateCache("posts:");
      invalidateCache("subs:");
      return { message: "Deleted" };
    } catch {
      set.status = 500; return { error: "Failed to delete" };
    }
  })

  .patch("/:id", async ({ params: { id }, body, userId, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const post = await db.post.findUnique({ where: { id } });
    if (!post) { set.status = 404; return { error: "Not found" }; }

    if (post.authorId !== userId) {
      set.status = 403; return { error: "Forbidden" };
    }

    try {
      if (body.subredditId) {
        const newSub = await db.subreddit.findUnique({ where: { id: body.subredditId } });
        if (!newSub) { set.status = 400; return { error: "Subreddit not found" }; }
      }

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

      const updatedPost = await db.post.update({
        where: { id },
        data: {
          title: body.title !== undefined ? body.title : undefined,
          content: body.content !== undefined ? body.content : undefined,
          subredditId: body.subredditId !== undefined ? body.subredditId : undefined,
          attachments: body.attachments !== undefined ? attachments : undefined,
          mediaUrl: body.attachments !== undefined ? null : undefined,
          mediaType: body.attachments !== undefined ? null : undefined,
        },
        include: {
          author: { select: { id: true, username: true, karma: true, avatarColor: true, avatarUrl: true } },
          subreddit: { include: { creator: { select: { id: true, username: true } } } },
          _count: { select: { comments: true, votes: true } },
          votes: { select: { type: true, userId: true } },
          bookmarks: { select: { userId: true } }
        }
      });
      invalidateCache('posts:');
      invalidateCache('subs:');
      return updatedPost;
    } catch {
      set.status = 500; return { error: "Failed to edit" };
    }
  }, {
    body: t.Object({
      title: t.Optional(t.String({ minLength: 1 })),
      content: t.Optional(t.String()),
      attachments: t.Optional(t.Array(t.Any())),
      subredditId: t.Optional(t.String()),
    })
  })

  .patch("/:id/note", async ({ params: { id }, body, userId, userRole, set }) => {
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    if (userRole !== "ADMIN") { set.status = 403; return { error: "Forbidden" }; }

    try {
      const post = await db.post.update({
        where: { id },
        data: { communityNote: body.communityNote },
      });
      return post;
    } catch {
      set.status = 500; return { error: "Failed to add note" };
    }
  }, {
    body: t.Object({
      communityNote: t.String()
    })
  });
