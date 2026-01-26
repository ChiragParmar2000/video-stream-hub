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
  
  // Match article elements with video data
  const articleRegex = /<article[^>]*data-video-id="([^"]*)"[^>]*data-main-thumb="([^"]*)"[^>]*>[\s\S]*?<a\s+href="([^"]*)"[^>]*>[\s\S]*?<span class="duration">[^<]*<\/i>([^<]*)<\/span>[\s\S]*?<\/article>/gi;
  
  let match;
  while ((match = articleRegex.exec(html)) !== null) {
    const [, videoId, thumbnail, href, duration] = match;
    
    // Check if HD
    const isHD = match[0].includes('class="hd-video"');
    
    // Extract title from thumbnail URL
    const title = extractTitleFromUrl(thumbnail);
    
    videos.push({
      id: videoId,
      thumbnail: thumbnail,
      title: title,
      duration: duration?.trim() || '',
      href: href,
      isHD: isHD,
    });
  }
  
  // Fallback regex for simpler parsing
  if (videos.length === 0) {
    const simpleRegex = /<article[^>]*data-video-id="([^"]*)"[^>]*data-main-thumb="([^"]*)"[^>]*>/gi;
    const hrefRegex = /<a\s+href="(https:\/\/fapnut\.net\/[^"]+)"/gi;
    const durationRegex = /<span class="duration">[^<]*<\/i>([^<]*)<\/span>/gi;
    
    const thumbMatches = [...html.matchAll(simpleRegex)];
    const hrefMatches = [...html.matchAll(hrefRegex)];
    const durationMatches = [...html.matchAll(durationRegex)];
    
    for (let i = 0; i < thumbMatches.length; i++) {
      const [, videoId, thumbnail] = thumbMatches[i];
      const href = hrefMatches[i]?.[1] || '';
      const duration = durationMatches[i]?.[1]?.trim() || '';
      
      videos.push({
        id: videoId,
        thumbnail: thumbnail,
        title: extractTitleFromUrl(thumbnail),
        duration: duration,
        href: href,
        isHD: true,
      });
    }
  }
  
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
    
    console.log(`Found ${videos.length} videos`);
    
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
