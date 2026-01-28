const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface VideoItem {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  href: string;
  isHD: boolean;
}

/**
 * Title MUST come from last part of video page URL
 * Example:
 * https://fapnut.net/kitty-lixo-bg-fucked-on-the-couch/
 * → kitty lixo bg fucked on the couch
 */
function extractTitleFromVideoPageUrl(url: string): string {
  try {
    const slug = url.replace(/\/$/, '').split('/').pop() || '';
    return slug.replace(/-/g, ' ').trim();
  } catch {
    return 'Untitled Video';
  }
}

function parseVideosFromHtml(html: string): VideoItem[] {
  const videos: VideoItem[] = [];

  // Split HTML into <article> blocks
  const articleSplits = html.split(/<article/gi);

  for (let i = 1; i < articleSplits.length; i++) {
    const article =
      '<article' +
      articleSplits[i].split(/<\/article>/i)[0] +
      '</article>';

    // Must be a video article
    if (!article.includes('data-video-id')) continue;

    // Video ID
    const videoIdMatch = article.match(/data-video-id="([^"]+)"/i);
    if (!videoIdMatch) continue;
    const videoId = videoIdMatch[1];

    // Thumbnail (IMPORTANT: comes from data-main-thumb)
    const thumbMatch = article.match(/data-main-thumb="([^"]+)"/i);
    if (!thumbMatch) continue;
    const thumbnail = thumbMatch[1];

    // Video page URL (API-2 URL)
    const hrefMatch = article.match(
      /<a\s+href="(https:\/\/fapnut\.net\/[^"]+\/)"/i
    );
    if (!hrefMatch) continue;
    const href = hrefMatch[1];

    // Skip unwanted links
    if (
      href.includes('/category/') ||
      href.includes('/tag/') ||
      href.includes('/page/') ||
      href.includes('/actors/') ||
      href.includes('/categories/') ||
      href.includes('/tags/') ||
      href.includes('?')
    ) {
      continue;
    }

    // Duration
    const durationMatch =
      article.match(
        /<span class="duration">[^<]*<i[^>]*><\/i>\s*([^<]*)<\/span>/i
      ) ||
      article.match(
        /<span class="duration">.*?<\/i>\s*([^<]*)<\/span>/is
      );
    const duration = durationMatch ? durationMatch[1].trim() : '';

    // HD flag
    const isHD = article.includes('hd-video');

    // Title from VIDEO PAGE URL (NOT image, NOT header)
    const title = extractTitleFromVideoPageUrl(href);

    videos.push({
      id: videoId,
      thumbnail,
      title,
      duration,
      href,
      isHD,
    });
  }

  console.log(`Parsed ${videos.length} valid videos`);
  return videos;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const page = Number(body.page) || 1;
    const source = body.source || 'video1';

    const sources: Record<string, string> = {
      video1: 'https://fapnut.net/page/',
      video2: 'https://fapnut.net/category/onlyfans/page/',
    };

    const baseUrl = sources[source] || sources.video1;
    const url = `${baseUrl}${page}/`;

    console.log(`Fetching videos from: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        referer: `https://fapnut.net/page/${Math.max(1, page - 1)}/`,
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch: ${response.status}`,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const html = await response.text();
    const videos = parseVideosFromHtml(html);

    return new Response(
      JSON.stringify({ success: true, videos, page }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
