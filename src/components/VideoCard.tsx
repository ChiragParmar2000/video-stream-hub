import { Play } from 'lucide-react';
import type { VideoItem } from '@/lib/api';

interface VideoCardProps {
  video: VideoItem;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative rounded-lg overflow-hidden bg-card cursor-pointer animate-fade-in transition-transform duration-200 active:scale-[0.98]"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg transform transition-all duration-200 group-hover:scale-110 opacity-90 group-hover:opacity-100">
            <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>
        
        {/* HD Badge */}
        {video.isHD && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded">
            HD
          </span>
        )}
        
        {/* Duration */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium bg-background/90 text-foreground rounded">
            {video.duration}
          </span>
        )}
      </div>
      
      {/* Title */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {video.title}
        </h3>
      </div>
    </div>
  );
}
