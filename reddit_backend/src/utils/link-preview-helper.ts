export function decodeHtmlEntities(str: string): string {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

export function detectPlatform(url: string) {
  const u = url.toLowerCase();
  // YouTube
  const ytMatch = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-z0-9_-]{11})/);
  if (ytMatch) {
    return { id: 'youtube', videoId: ytMatch[1], embedHtml: true };
  }
  // Twitter / X
  if (u.includes('twitter.com') || u.includes('x.com')) {
    return { id: 'twitter', embedHtml: true };
  }
  // Facebook
  if (u.includes('facebook.com') || u.includes('fb.com')) {
    return { id: 'facebook', embedHtml: true };
  }
  // Instagram
  if (u.includes('instagram.com') || u.includes('instagr.am')) {
    return { id: 'instagram', embedHtml: true };
  }
  // TikTok
  if (u.includes('tiktok.com')) {
    return { id: 'tiktok', embedHtml: true };
  }
  return null;
}

export async function fetchLinkPreview(url: string) {
  const platform = detectPlatform(url);

  // TikTok oEmbed implementation
  if (platform?.id === 'tiktok') {
    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data: any = await res.json();
        return {
          url,
          platform: 'tiktok',
          title: decodeHtmlEntities(data.title || 'TikTok Video'),
          description: decodeHtmlEntities(data.author_name ? `Video by ${data.author_name}` : 'Watch video on TikTok'),
          image: data.thumbnail_url,
          siteName: 'TikTok',
          embedHtml: data.html
        };
      }
    } catch (err) {
      console.error("TikTok oEmbed fetch error:", err);
    }
    return {
      url,
      platform: 'tiktok',
      title: 'TikTok Video',
      description: 'Watch video on TikTok',
      siteName: 'TikTok'
    };
  }

  // Facebook clean fallback
  if (platform?.id === 'facebook') {
    let title = 'Facebook Link';
    let description = 'View post or profile on Facebook';
    try {
      const parsed = new URL(url);
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        if (pathSegments[0] === 'groups') {
          title = `Facebook Group - ${pathSegments[1] || ''}`;
        } else if (pathSegments[0] === 'pages') {
          title = `Facebook Page - ${pathSegments[1] || ''}`;
        } else if (pathSegments[0] === 'share' && pathSegments[1] === 'p') {
          title = 'Facebook Share';
        } else if (pathSegments.includes('posts') || pathSegments.includes('permalink.php')) {
          title = 'Facebook Post';
        } else {
          title = `Facebook Profile - ${pathSegments[0]}`;
        }
      }
    } catch {}
    return {
      url,
      platform: 'facebook',
      title,
      description,
      siteName: 'Facebook'
    };
  }

  // Instagram clean fallback
  if (platform?.id === 'instagram') {
    let title = 'Instagram Link';
    let description = 'View photo or video on Instagram';
    try {
      const parsed = new URL(url);
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        if (pathSegments[0] === 'p' || pathSegments[0] === 'reel' || pathSegments[0] === 'tv') {
          title = `Instagram Post (${pathSegments[0].toUpperCase()})`;
        } else {
          title = `Instagram Profile - @${pathSegments[0]}`;
        }
      }
    } catch {}
    return {
      url,
      platform: 'instagram',
      title,
      description,
      siteName: 'Instagram'
    };
  }

  // Twitter / X clean fallback
  if (platform?.id === 'twitter') {
    let title = 'X / Twitter Link';
    let description = 'View tweet or profile on X';
    try {
      const parsed = new URL(url);
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        if (pathSegments.includes('status')) {
          const user = pathSegments[0];
          title = `X / Twitter Tweet - @${user}`;
        } else {
          title = `X / Twitter Profile - @${pathSegments[0]}`;
        }
      }
    } catch {}
    return {
      url,
      platform: 'twitter',
      title,
      description,
      siteName: 'X / Twitter'
    };
  }

  // YouTube logic (which has videoId)
  if (platform?.id === 'youtube') {
    return {
      url,
      platform: 'youtube',
      videoId: platform.videoId,
      title: 'YouTube Video',
      siteName: 'YouTube'
    };
  }

  // Fallback for regular websites
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DevShareBot/1.0)' },
      signal: AbortSignal.timeout(4000)
    });
    const html = await res.text();
    const getMeta = (prop: string) => {
      const match = html.match(new RegExp(`<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']+)["']`, 'i')) ||
                    html.match(new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${prop}["']`, 'i'));
      return match ? decodeHtmlEntities(match[1]) : null;
    };
    
    let title = getMeta('og:title') || getMeta('twitter:title');
    if (!title) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = decodeHtmlEntities(titleMatch[1]);
      }
    }
    const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description');
    const image = getMeta('og:image') || getMeta('twitter:image');
    const siteName = getMeta('og:site_name') || getMeta('al:android:app_name') || '';

    if (title || description || image) {
      return {
        url,
        platform: platform?.id || 'website',
        title: title || url,
        description: description ? decodeHtmlEntities(description) : undefined,
        image: image ? decodeHtmlEntities(image) : undefined,
        siteName: siteName ? decodeHtmlEntities(siteName) : undefined
      };
    }
  } catch (err) {
    console.error(`Error scraping ${url}:`, err);
  }
  return { url, platform: 'website', title: url };
}
