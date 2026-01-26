import { useState, useEffect, useCallback } from 'react';
import { VideoCard } from '@/components/VideoCard';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Pagination } from '@/components/Pagination';
import { SourceTabs } from '@/components/SourceTabs';
import { VideoGridSkeleton } from '@/components/VideoGridSkeleton';
import { fetchVideos, fetchVideoStream, type VideoItem, type VideoStream } from '@/lib/api';
import { VIDEO_SOURCES } from '@/config/sources';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ViewState = 'list' | 'player';

const Index = () => {
  const [activeSource, setActiveSource] = useState(VIDEO_SOURCES[0].id);
  const [currentPage, setCurrentPage] = useState(1);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const [streamData, setStreamData] = useState<VideoStream | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const { toast } = useToast();

  const loadVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchVideos(currentPage, activeSource);
      setVideos(result.videos);
    } catch (error) {
      console.error('Failed to load videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load videos. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeSource, toast]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleSourceChange = (sourceId: string) => {
    setActiveSource(sourceId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoClick = async (video: VideoItem) => {
    setSelectedVideo({ url: video.href, title: video.title });
    setIsLoadingStream(true);
    setViewState('player');

    try {
      const stream = await fetchVideoStream(video.href);
      setStreamData(stream);
    } catch (error) {
      console.error('Failed to load video stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to load video. Please try again.',
        variant: 'destructive',
      });
      setViewState('list');
    } finally {
      setIsLoadingStream(false);
    }
  };

  const handleBackFromPlayer = () => {
    setViewState('list');
    setStreamData(null);
    setSelectedVideo(null);
  };

  // Player View
  if (viewState === 'player') {
    if (isLoadingStream) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      );
    }

    if (streamData) {
      return (
        <VideoPlayer
          streamUrl={streamData.streamUrl}
          title={streamData.title || selectedVideo?.title || 'Video'}
          onBack={handleBackFromPlayer}
        />
      );
    }
  }

  // List View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gradient mb-3">Videos</h1>
          <SourceTabs
            activeSource={activeSource}
            onSourceChange={handleSourceChange}
          />
        </div>
      </header>

      {/* Content */}
      <main className="pb-20">
        {isLoading ? (
          <div className="pt-4">
            <VideoGridSkeleton />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <p className="text-muted-foreground">No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => handleVideoClick(video)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Pagination */}
      {!isLoading && videos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
          <Pagination
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
