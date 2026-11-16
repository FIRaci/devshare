import { Elysia, t } from "elysia";
import { db, getCached, setCache, invalidateCache } from "../db";

import { fetchLinkPreview } from "../utils/link-preview-helper";

export const postRoutes = new Elysia({ prefix: "/posts" })
  // GET posts with optional sort, order, q, and subreddit filtering
  .get("/", async ({ query }: { query: { sort?: string; order?: string; q?: string; subreddit?: string } }) => {
    const sort = query.sort || 'new';
    const order = (query.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const q = (query.q || '').trim();
    const subreddit = (query.subreddit || '').trim();

    const cacheKey = `posts:${subreddit || 'all'}:${sort}:${order}:${q}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const where: any = {};
    if (subreddit) {
      where.subreddit = { name: subreddit };
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } }
      ];
    }

    let posts = await db.post.findMany({
      where,
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
      orderBy: { createdAt: order }
    });

    // Score calculation helper: UP = +1, DOWN = -1
    const getScore = (votes: { type: string }[] = []) =>
      votes.reduce((acc, v) => acc + (v.type === 'UP' ? 1 : -1), 0);

    if (sort === 'top') {
      posts.sort((a, b) => {
        const diff = getScore(b.votes) - getScore(a.votes);
        return order === 'asc' ? -diff : diff;
      });
    } else if (sort === 'hot') {
      posts.sort((a, b) => {
        const scoreA = getScore(a.votes) + (a._count?.comments ?? 0) * 2;
        const scoreB = getScore(b.votes) + (b._count?.comments ?? 0) * 2;
        const diff = scoreB - scoreA;
        return order === 'asc' ? -diff : diff;
      });
    }

    setCache(cacheKey, posts, 8000);
    return posts;
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

    // Enforce business rule: user must join the community before posting
    const isMember = await db.subscription.findUnique({
      where: {
        userId_subredditId: { userId, subredditId: body.subredditId }
      }
    });
    if (!isMember) {
      set.status = 403;
      return {
        error: `You must join d/${subreddit.name} before you can post in this community`,
        requiresJoin: true,
        subredditName: subreddit.name,
        subredditId: subreddit.id
      };
    }

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
