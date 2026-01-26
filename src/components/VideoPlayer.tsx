import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { ArrowLeft, Maximize, Minimize, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  onBack: () => void;
}

export function VideoPlayer({ streamUrl, title, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    let hls: Hls | null = null;

    const initPlayer = async () => {
      setIsLoading(true);
      setError(null);

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(console.error);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error('HLS Error:', data);
            setError('Failed to load video. Please try again.');
            setIsLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          video.play().catch(console.error);
        });
        video.addEventListener('error', () => {
          setError('Failed to load video.');
          setIsLoading(false);
        });
      } else {
        setError('HLS playback is not supported in this browser.');
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl]);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
        
        // Lock to landscape on mobile
        if (screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {
            // Orientation lock not supported
          }
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        
        if (screen.orientation && 'unlock' in screen.orientation) {
          try {
            (screen.orientation as any).unlock();
          } catch (e) {
            // Ignore
          }
        }
      }
    } catch (e) {
      console.error('Fullscreen error:', e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className={`flex items-center gap-3 p-3 ${isFullscreen ? 'absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/90 to-transparent' : ''}`}>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-sm font-medium text-foreground line-clamp-1 flex-1">{title}</h1>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Video Container */}
      <div className={`relative flex-1 bg-black ${isFullscreen ? 'w-full h-full' : ''}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          playsInline
          autoPlay
        />
      </div>

      {/* Title Bar (non-fullscreen) */}
      {!isFullscreen && (
        <div className="p-4 bg-card border-t border-border safe-bottom">
          <h2 className="text-base font-medium text-foreground">{title}</h2>
        </div>
      )}
    </div>
  );
}
