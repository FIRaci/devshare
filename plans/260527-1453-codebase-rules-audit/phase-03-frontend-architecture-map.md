---
phase: 3
title: "Frontend architecture map"
status: pending
priority: P2
effort: "2h"
dependencies: [1]
---

# Phase 3: Frontend architecture map

## Overview
Map React app structure, state, and API usage so contributors know where and
how to change UI behavior.

## Context Links
- App shell: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/App.jsx
- Entry: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/main.jsx
- Auth context: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/AuthContext.jsx
- UI components: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/
- Styles: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/App.css
- Base styles: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/index.css

## Requirements
- Functional: document component responsibilities and data flows; list API calls.
- Non-functional: capture theming approach and UI token sources.

## Architecture
- React SPA without router; shared links use hash `#/post/{id}`.
- AuthContext stores user in localStorage; API base from VITE_API_URL.
- App.jsx owns most state; sessionStorage caches posts/subs.
- Theme toggled by `data-theme` and CSS variables.

## Related Code Files
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/main.jsx
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/App.jsx
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/AuthContext.jsx
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/AuthPage.jsx
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/ProfilePage.jsx
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/CreatePostModal.jsx
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/MediaRenderer.jsx
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/MarkdownRenderer.jsx
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/Lightbox.jsx
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/App.css
- Inspect: C:/Users/TSC/Desktop/Nothing/devshare/reddit_frontend/src/index.css

## Implementation Steps
1. Create a component map with responsibilities and props.
2. Record API calls by component (auth, posts, comments, profile, notifications).
3. Document client-side caching and optimistic UI updates.
4. Note UI tokens, theme toggles, and CSS organization.

## Todo List
- [ ] Component responsibility map
- [ ] API usage matrix
- [ ] Caching and UI patterns summary

## Success Criteria
- [ ] Frontend map links components to backend endpoints
- [ ] UI patterns and theming rules captured

## Risk Assessment
- Large App.jsx and render-phase state sync are maintenance risks; flag for future refactor.

## Security Considerations
- MarkdownRenderer sanitizes links to http(s); confirm no other unsafe HTML paths.

## Next Steps
- Use this map to align coding rules and onboarding docs.
