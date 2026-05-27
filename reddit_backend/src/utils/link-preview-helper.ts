import { isValidUrl } from "../url-validator";

export function decodeHtmlEntities(str: string): string {
  if (!str) return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function extractYoutubeId(url: string): string | null {
  const m = url.toLowerCase().match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function detectPlatform(url: string) {
  const u = url.toLowerCase();
  const ytMatch = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-z0-9_-]{11})/);
  if (ytMatch) return { id: 'youtube', videoId: ytMatch[1] };
  if (u.includes('twitter.com') || u.includes('x.com')) return { id: 'twitter' };
  if (u.includes('facebook.com') || u.includes('fb.com')) return { id: 'facebook' };
  if (u.includes('instagram.com') || u.includes('instagr.am')) return { id: 'instagram' };
  if (u.includes('tiktok.com')) return { id: 'tiktok' };
  return null;
}

const fetchOptions = {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  signal: AbortSignal.timeout(4000)
};

const previewCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key: string) {
  const entry = previewCache.get(key);
  if (!entry || Date.now() > entry.expires) {
    previewCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: any) {
  if (previewCache.size >= 300) {
    const firstKey = previewCache.keys().next().value;
    if (firstKey) previewCache.delete(firstKey);
  }
  previewCache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

async function fetchOEmbed(url: string, apiUrl: string): Promise<any | null> {
  try {
    const res = await fetch(apiUrl, fetchOptions);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function scrapeOG(url: string): Promise<{
  title?: string; description?: string; image?: string; siteName?: string;
  oembedEndpoint?: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DevShareBot/1.0)' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (html.length > 500_000) return null;

    const getMeta = (prop: string) => {
      const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"]*)["']`, "i");
      const re2 = new RegExp(`<meta[^>]+content=["']([^"]*)["'][^>]+(?:property|name)=["']${escaped}["']`, "i");
      const m1 = html.match(re1);
      if (m1) return decodeHtmlEntities(m1[1]);
      const m2 = html.match(re2);
      return m2 ? decodeHtmlEntities(m2[1]) : null;
    };

    let title = getMeta("og:title") || getMeta("twitter:title");
    if (!title) {
      const tm = html.match(/<title>([^<]+)<\/title>/i);
      if (tm) title = decodeHtmlEntities(tm[1]);
    }
    const description = getMeta("og:description") || getMeta("twitter:description") || getMeta("description");
    const image = getMeta("og:image") || getMeta("twitter:image");
    const siteName = getMeta("og:site_name") || getMeta("al:android:app_name") || "";

    const oembedMatch = html.match(/<link[^>]+type=["']application\/json\+oembed["'][^>]+href=["']([^"']+)["']/i);
    const oembedEndpoint = oembedMatch ? decodeHtmlEntities(oembedMatch[1]) : null;

    return { title, description, image, siteName, oembedEndpoint };
  } catch {
    return null;
  }
}

export async function fetchLinkPreview(url: string) {
  if (!isValidUrl(url)) {
    return { url, platform: "website", title: url, description: "Invalid or blocked URL" };
  }

  const cached = getCached(url);
  if (cached) return cached;

  const platform = detectPlatform(url);
  const videoId = platform?.id === 'youtube' ? extractYoutubeId(url) : null;

  let result: any = { url, platform: platform?.id || "website", title: url };

  if (platform?.id === 'tiktok') {
    const oembed = await fetchOEmbed(url, `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (oembed) {
      result = {
        url, platform: 'tiktok',
        title: decodeHtmlEntities(oembed.title || 'TikTok Video'),
        description: decodeHtmlEntities(oembed.author_name ? `Video by ${oembed.author_name}` : 'Watch video on TikTok'),
        image: oembed.thumbnail_url,
        siteName: 'TikTok',
        embedHtml: oembed.html
      };
    } else {
      result = { url, platform: 'tiktok', title: 'TikTok Video', description: 'Watch video on TikTok', siteName: 'TikTok' };
    }
    setCached(url, result);
    return result;
  }

  if (platform?.id === 'youtube') {
    const og = await scrapeOG(url);
    result = {
      url, platform: 'youtube', videoId,
      title: og?.title || 'YouTube Video',
      description: og?.description,
      image: og?.image,
      siteName: 'YouTube'
    };
    setCached(url, result);
    return result;
  }

  if (platform?.id === 'twitter') {
    const oembed = await fetchOEmbed(url, `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`);
    if (oembed) {
      const hasIframe = oembed.html?.startsWith('<iframe') && !oembed.html?.includes('<script');
      result = {
        url, platform: 'twitter',
        title: decodeHtmlEntities(oembed.title || oembed.author_name || 'X / Twitter'),
        description: decodeHtmlEntities(oembed.author_name ? `Tweet by ${oembed.author_name}` : undefined),
        image: oembed.thumbnail_url,
        siteName: 'X / Twitter',
        ...(hasIframe ? { embedHtml: oembed.html } : {})
      };
    } else {
      result = fallbackPathParse(url, 'twitter', 'X / Twitter');
    }
    setCached(url, result);
    return result;
  }

  if (platform?.id === 'facebook' || platform?.id === 'instagram') {
    const og = await scrapeOG(url);
    if (og && (og.title || og.description || og.image)) {
      result = {
        url, platform: platform.id,
        title: og.title || `${platform.id === 'facebook' ? 'Facebook' : 'Instagram'} Link`,
        description: og.description,
        image: og.image,
        siteName: platform.id === 'facebook' ? 'Facebook' : 'Instagram'
      };
    } else {
      result = fallbackPathParse(url, platform.id, platform.id === 'facebook' ? 'Facebook' : 'Instagram');
    }
    setCached(url, result);
    return result;
  }

  const og = await scrapeOG(url);
  if (og) {
    result = {
      url, platform: 'website',
      title: og.title || url,
      description: og.description ? decodeHtmlEntities(og.description) : undefined,
      image: og.image ? decodeHtmlEntities(og.image) : undefined,
      siteName: og.siteName ? decodeHtmlEntities(og.siteName) : undefined,
    };
    if (og.oembedEndpoint && og.oembedEndpoint.startsWith('http')) {
      const oembedData = await fetchOEmbed(url, og.oembedEndpoint);
      if (oembedData) {
        if (oembedData.title) result.title = decodeHtmlEntities(oembedData.title);
        if (oembedData.description) result.description = decodeHtmlEntities(oembedData.description);
        if (oembedData.thumbnail_url) result.image = decodeHtmlEntities(oembedData.thumbnail_url);
        if (oembedData.author_name) result.authorName = decodeHtmlEntities(oembedData.author_name);
        if (oembedData.html?.startsWith('<iframe') && !oembedData.html?.includes('<script')) {
          result.embedHtml = oembedData.html;
        }
      }
    }
  }

  setCached(url, result);
  return result;
}

function fallbackPathParse(url: string, platformId: string, siteName: string) {
  let title = `${siteName} Link`;
  let description = `View on ${siteName}`;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      if (platformId === 'twitter') {
        if (segments.includes('status')) {
          title = `X / Twitter Tweet - @${segments[0]}`;
        } else {
          title = `X / Twitter Profile - @${segments[0]}`;
        }
      } else if (platformId === 'facebook') {
        if (segments[0] === 'groups') title = `Facebook Group - ${segments[1] || ''}`;
        else if (segments[0] === 'pages') title = `Facebook Page - ${segments[1] || ''}`;
        else if (segments.includes('posts') || segments.includes('permalink.php')) title = 'Facebook Post';
        else title = `Facebook Profile - ${segments[0]}`;
      } else if (platformId === 'instagram') {
        if (segments[0] === 'p' || segments[0] === 'reel' || segments[0] === 'tv') {
          title = `Instagram Post (${segments[0].toUpperCase()})`;
        } else {
          title = `Instagram Profile - @${segments[0]}`;
        }
      }
    }
  } catch {}
  return { url, platform: platformId, title, description, siteName };
}
