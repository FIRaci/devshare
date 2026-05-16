import { Elysia, t } from "elysia";
import { db, getCached, setCache, invalidateCache } from "../db";

async function fetchLinkPreview(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'bot' }, signal: AbortSignal.timeout(3000) });
    const html = await res.text();
    const getMeta = (prop: string) => {
      const match = html.match(new RegExp(`<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']+)["']`, 'i')) || 
                    html.match(new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${prop}["']`, 'i'));
      return match ? match[1] : null;
    };
    const title = getMeta('og:title') || getMeta('twitter:title') || html.match(/<title>([^<]+)<\/title>/i)?.[1];
    const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description');
    const image = getMeta('og:image') || getMeta('twitter:image');
    
    if (title || description || image) {
      return { url, title, description, image };
    }
  } catch {}
  return null;
}

// Helper: get first user as mock session until JWT is implemented
const getDefaultUser = async () => db.user.findFirst();

export const postRoutes = new Elysia({ prefix: "/posts" })
  // GET all posts - include vote count properly
  .get("/", async () => {
    const cached = getCached<any>('posts:all');
    if (cached) return cached;
    const data = await db.post.findMany({
      include: {
        author: {
          select: { id: true, username: true, karma: true, avatarColor: true, avatarUrl: true }
        },
        subreddit: true,
        _count: {
          select: { comments: true, votes: true }
        },
        votes: {
          select: { type: true, userId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    setCache('posts:all', data, 10000);
    return data;
  })

  // GET single post with full comments tree
  .get("/:id", async ({ params: { id }, set }) => {
    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, karma: true, avatarColor: true, avatarUrl: true }
        },
        subreddit: true,
        votes: {
          select: { type: true, userId: true }
        },
        _count: { select: { comments: true, votes: true } },
        comments: {
          where: { parentId: null }, // top-level only
          include: {
            author: { select: { id: true, username: true } },
            votes: { select: { type: true, userId: true } },
            replies: {
              include: {
                author: { select: { id: true, username: true } },
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

  // POST create post - use actual logged-in user
  .post("/", async ({ body, headers, set }) => {
    const userId = headers["x-user-id"];
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      set.status = 401;
      return { error: "User not found" };
    }

    // Verify subreddit exists
    const subreddit = await db.subreddit.findUnique({ where: { id: body.subredditId } });
    if (!subreddit) {
      set.status = 400;
      return { error: "Subreddit not found" };
    }

    try {
      let linkPreview = null;
      if (body.linkUrl) {
        linkPreview = await fetchLinkPreview(body.linkUrl);
      }

      const post = await db.post.create({
        data: {
          title: body.title,
          content: body.content,
          authorId: user.id,
          subredditId: body.subredditId,
          mediaUrl: body.mediaUrl,
          mediaType: body.mediaType,
          linkPreview: linkPreview ? linkPreview : undefined
        },
        include: {
          author: { select: { id: true, username: true } },
          subreddit: true,
          _count: { select: { comments: true, votes: true } },
          votes: { select: { type: true, userId: true } }
        }
      });

      // Create notifications for subscribers (excluding the author)
      const subscribers = await db.subscription.findMany({
        where: { subredditId: body.subredditId, userId: { not: user.id } }
      });
      if (subscribers.length > 0) {
        await db.notification.createMany({
          data: subscribers.map(sub => ({
            type: "POST_IN_SUBREDDIT",
            userId: sub.userId,
            actorId: user.id,
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
      linkUrl: t.Optional(t.String())
    })
  })

  // POST vote on a post
  .post("/:id/vote", async ({ params: { id }, body, headers, set }) => {
    const userId = headers["x-user-id"];
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      set.status = 401;
      return { error: "User not found" };
    }

    // Verify post exists
    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }

    try {
      // If same vote type already exists, remove it (toggle off)
      const existing = await db.vote.findUnique({
        where: { userId_postId: { userId: user.id, postId: id } }
      });

      if (existing && existing.type === body.type) {
        // toggle off
        await db.vote.delete({ where: { userId_postId: { userId: user.id, postId: id } } });
        return { action: "removed" };
      }

      const vote = await db.vote.upsert({
        where: { userId_postId: { userId: user.id, postId: id } },
        update: { type: body.type },
        create: { type: body.type, userId: user.id, postId: id }
      });
      return vote;
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

  // DELETE a post (Admin or Author)
  .delete("/:id", async ({ params: { id }, headers, set }) => {
    const userId = headers["x-user-id"];
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const user = await db.user.findUnique({ where: { id: userId } });
    const post = await db.post.findUnique({ where: { id } });
    if (!post || !user) { set.status = 404; return { error: "Not found" }; }

    if (post.authorId !== user.id && user.role !== "ADMIN") {
      set.status = 403; return { error: "Forbidden" };
    }

    try {
      await db.post.delete({ where: { id } });
      invalidateCache('posts:');
      invalidateCache('subs:');
      return { message: "Deleted" };
    } catch {
      set.status = 500; return { error: "Failed to delete" };
    }
  })

  // PATCH edit a post (Author only)
  .patch("/:id", async ({ params: { id }, body, headers, set }) => {
    const userId = headers["x-user-id"];
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const post = await db.post.findUnique({ where: { id } });
    if (!post) { set.status = 404; return { error: "Not found" }; }

    if (post.authorId !== userId) {
      set.status = 403; return { error: "Forbidden" };
    }

    try {
      const updatedPost = await db.post.update({
        where: { id },
        data: {
          title: body.title !== undefined ? body.title : undefined,
          content: body.content !== undefined ? body.content : undefined,
        },
        include: {
          author: { select: { id: true, username: true, karma: true, avatarColor: true, avatarUrl: true } },
          subreddit: true,
          _count: { select: { comments: true, votes: true } },
          votes: { select: { type: true, userId: true } }
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
    })
  })

  // PATCH add community note (Admin only)
  .patch("/:id/note", async ({ params: { id }, body, headers, set }) => {
    const userId = headers["x-user-id"];
    if (!userId) { set.status = 401; return { error: "Unauthorized" }; }
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "ADMIN") { set.status = 403; return { error: "Forbidden" }; }

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
