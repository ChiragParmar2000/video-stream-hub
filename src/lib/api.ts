import { supabase } from '@/integrations/supabase/client';

export interface VideoItem {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  href: string;
  isHD: boolean;
}

export interface VideoStream {
  streamUrl: string;
  title: string;
  thumbnail: string;
  duration: string;
}

export async function fetchVideos(page: number, source: string): Promise<{ videos: VideoItem[]; page: number }> {
  const { data, error } = await supabase.functions.invoke('fetch-videos', {
    body: { page, source },
  });

  if (error) {
    console.error('Error fetching videos:', error);
    throw new Error(error.message);
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch videos');
  }

  return { videos: data.videos, page: data.page };
}

export async function fetchVideoStream(videoUrl: string): Promise<VideoStream> {
  const { data, error } = await supabase.functions.invoke('fetch-video-stream', {
    body: { videoUrl },
  });

  if (error) {
    console.error('Error fetching video stream:', error);
    throw new Error(error.message);
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch video stream');
  }

  return {
    streamUrl: data.streamUrl,
    title: data.title,
    thumbnail: data.thumbnail,
    duration: data.duration,
  };
}
