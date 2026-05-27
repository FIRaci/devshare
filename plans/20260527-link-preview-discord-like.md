# Plan: Discord-like Link Previews

## Overview
Upgrade link previews to Discord quality — rich embeds with images, iframes, and clean cards for all link types.

## Files to Modify
- `reddit_backend/src/utils/link-preview-helper.ts` — server-side fetch logic
- `reddit_frontend/src/MediaRenderer.jsx` — frontend embed/card rendering
- `reddit_frontend/src/App.css` — Discord-style card styling

## Implementation Steps

### Step 1: Server — Twitter oEmbed + YouTube OG scrape + caching
- **Twitter oEmbed**: Call `publish.twitter.com/oembed` → get `title`, `author_name`, `thumbnail_url`. Return rich metadata instead of just path parsing.
- **YouTube OG scrape**: Don't return static "YouTube Video" — scrape OG tags like generic sites for real title/description/image.
- **Facebook/Instagram**: Try OG scraping first (use generic fallback path), fall back to path parsing if blocked.
- **Generic oEmbed discovery**: After fetching HTML for OG tags, look for `<link rel="alternate" type="application/json+oembed">`. If found, fetch oEmbed for richer data + possible iframe embed.
- **Link preview cache**: Add in-memory TTL cache (10 min) keyed by URL to avoid re-fetching same link.

### Step 2: Frontend — Render embeds + richer cards
- **TikTok embed**: Render `embedHtml` (iframe) in a responsive container when available.
- **Generic oEmbed embed**: If `embedHtml` is iframe-only (no script tags), render it.
- **Show OG image for all platforms**: Remove `!isTwitter && !isFacebook` restriction.
- **Platform-specific card styling**: Distinct visual treatment per platform.

### Step 3: CSS — Discord-style card design
- `.link-preview-card`: Clean border, hover lift, prominent image (16:9 crop), tighter info area.
- `.embed-iframe-wrap`: Responsive aspect-ratio container for iframe embeds (TikTok, generic oEmbed).
- Platform badges: Colored top border instead of text badge.
