const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoItem {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  href: string;
  isHD: boolean;
}

function extractTitleFromUrl(url: string): string {
  try {
    const match = url.match(/\/([^\/]+)\.(png|jpg|jpeg|webp)/i);
    if (match) {
      return match[1].replace(/-/g, ' ').replace(/\d{4}\/\d{2}\//g, '').trim();
    }
    return 'Untitled Video';
  } catch {
    return 'Untitled Video';
  }
}

function parseVideosFromHtml(html: string): VideoItem[] {
  const videos: VideoItem[] = [];
  
  // Split by article tags to get individual video entries
  const articleSplits = html.split(/<article/gi);
  
  for (let i = 1; i < articleSplits.length; i++) {
    const article = '<article' + articleSplits[i].split(/<\/article>/i)[0] + '</article>';
    
    // Check if this is a video article (has loop-video class)
    if (!article.includes('loop-video')) {
      continue;
    }
    
    // Extract video ID
    const videoIdMatch = article.match(/data-video-id="([^"]*)"/);
    if (!videoIdMatch) continue;
    const videoId = videoIdMatch[1];
    
    // Extract thumbnail
    const thumbMatch = article.match(/data-main-thumb="([^"]*)"/);
    if (!thumbMatch) continue;
    const thumbnail = thumbMatch[1];
    
    // Extract href - look for the main video link (after the thumbnail div)
    // The video link format is like: https://fapnut.net/video-title-here/
    const hrefMatch = article.match(/<a\s+href="(https:\/\/fapnut\.net\/[a-z0-9\-]+-[a-z0-9\-]+\/)"/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];
    
    // Skip category/tag/filter links
    if (href.includes('/category/') || href.includes('/tag/') || href.includes('/page/') || 
        href.includes('/actors/') || href.includes('/categories/') || href.includes('/tags/') ||
        href.includes('?filter=')) {
      continue;
    }
    
    // Extract duration
    const durationMatch = article.match(/<span class="duration">[^<]*<i[^>]*><\/i>([^<]*)<\/span>/i) ||
                         article.match(/<span class="duration">.*?<\/i>\s*([^<]*)<\/span>/is);
    const duration = durationMatch ? durationMatch[1].trim() : '';
    
    // Check if HD
    const isHD = article.includes('hd-video');
    
    // Extract title from entry-header
    const titleMatch = article.match(/<header class="entry-header">\s*<span>([^<]*)<\/span>/i);
    let title = '';
    if (titleMatch) {
      title = titleMatch[1]
        .replace(/&#8211;/g, '-')
        .replace(/&#8217;/g, "'")
        .replace(/&#\d+;/g, '')
        .trim();
    }
    
    if (!title) {
      title = extractTitleFromUrl(thumbnail);
    }
    
    videos.push({
      id: videoId,
      thumbnail: thumbnail,
      title: title,
      duration: duration,
      href: href,
      isHD: isHD,
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
    const { page = 1, source = 'video1' } = await req.json();
    
    // Define sources - easily expandable
    const sources: Record<string, string> = {
      video1: 'https://fapnut.net/page/',
      video2: 'https://fapnut.net/category/onlyfans/page/',
    };
    
    const baseUrl = sources[source] || sources.video1;
    const url = `${baseUrl}${page}/`;
    
    console.log(`Fetching videos from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'upgrade-insecure-requests': '1',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        'referer': `https://fapnut.net/page/${Math.max(1, page - 1)}/`,
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch: ${response.status}`);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const html = await response.text();
    const videos = parseVideosFromHtml(html);
    
    console.log(`Returning ${videos.length} videos for page ${page}`);
    
    return new Response(
      JSON.stringify({ success: true, videos, page }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching videos:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
