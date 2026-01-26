const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractM3u8Url(html: string): string | null {
  // Look for m3u8 URL in meta content
  const metaMatch = html.match(/content="([^"]*\.m3u8)"/i);
  if (metaMatch) {
    return decodeURIComponent(metaMatch[1]);
  }
  
  // Look for m3u8 in any context
  const generalMatch = html.match(/(https?:\/\/[^\s"'<>]*\.m3u8)/i);
  if (generalMatch) {
    return decodeURIComponent(generalMatch[1]);
  }
  
  return null;
}

function extractVideoInfo(html: string): { title: string; thumbnail: string; duration: string } {
  // Extract title
  const titleMatch = html.match(/itemprop="name"\s+content="([^"]*)"/i);
  const title = titleMatch ? titleMatch[1].replace(/&#8211;/g, '-').replace(/&#\d+;/g, '') : 'Untitled';
  
  // Extract thumbnail
  const thumbMatch = html.match(/itemprop="thumbnailUrl"\s+content="([^"]*)"/i);
  const thumbnail = thumbMatch ? thumbMatch[1] : '';
  
  // Extract duration
  const durationMatch = html.match(/itemprop="duration"\s+content="([^"]*)"/i);
  const duration = durationMatch ? durationMatch[1] : '';
  
  return { title, thumbnail, duration };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();
    
    if (!videoUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Video URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Fetching video page: ${videoUrl}`);
    
    const response = await fetch(videoUrl, {
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
        'referer': 'https://fapnut.net/',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch video page: ${response.status}`);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const html = await response.text();
    const streamUrl = extractM3u8Url(html);
    const videoInfo = extractVideoInfo(html);
    
    if (!streamUrl) {
      console.error('Could not find m3u8 stream URL');
      return new Response(
        JSON.stringify({ success: false, error: 'Stream URL not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found stream URL: ${streamUrl}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        streamUrl,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        duration: videoInfo.duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching video stream:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
