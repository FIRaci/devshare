---
phase: 2
title: "Backend architecture map"
status: pending
priority: P2
effort: "2h"
dependencies: [1]
---

# Phase 2: Backend architecture map

## Overview
Map backend runtime, API routes, data model, and support scripts to create a
clear backend reference.

## Context Links
- API entry: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/index.ts
- Routes: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/routes/
- Prisma schema: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/prisma/schema.prisma
- DB client: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/db.ts
- Link preview: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/utils/link-preview-helper.ts

## Requirements
- Functional: list endpoints per route, auth/role checks, upload flow,
  notifications, and cache rules.
- Non-functional: keep docs accurate to current code; note legacy fields.

## Architecture
- Elysia app with route modules (auth, posts, subreddits, comments, reports,
  notifications).
- Prisma models: User, Subreddit, Post, Comment, Vote, Report, Subscription,
  Notification, Bookmark.
- Auth: identity from `x-user-id` header; no JWT middleware in code.
- Uploads: `/upload` writes to public/uploads and returns public URL.
- Link preview: oEmbed + scrape fallback in server helper.

## Related Code Files
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/index.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/db.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/routes/auth.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/routes/posts.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/routes/comments.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/routes/subreddits.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/routes/reports.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/routes/notifications.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/utils/link-preview-helper.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/prisma/schema.prisma
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/prisma.config.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/src/seed.ts
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/add_attachments.sql
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_backend/fix_db_urls.ts

## Implementation Steps
1. Create endpoint matrix: path, method, auth, role, side effects.
2. Map Prisma models and relationships (include legacy fields and attachments).
3. Document cache keys and invalidation points.
4. Document upload and link preview flows.
5. Summarize admin/moderator checks.

## Todo List
- [ ] API endpoint matrix
- [ ] Data model map
- [ ] Cache and upload flows

## Success Criteria
- [ ] Backend map includes routes, models, and auth assumptions
- [ ] Legacy fields and attachment behavior documented

## Risk Assessment
- Auth is header-based; may not match production auth plan. Flag as assumption.

## Security Considerations
- Note reliance on `x-user-id` and lack of JWT middleware in code.
- Document file upload size limit and validation gaps.

## Next Steps
- Cross-check frontend API usage against the backend map.
