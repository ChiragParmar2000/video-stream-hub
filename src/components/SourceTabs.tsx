import { VIDEO_SOURCES, type VideoSource } from '@/config/sources';

interface SourceTabsProps {
  activeSource: string;
  onSourceChange: (sourceId: string) => void;
}

export function SourceTabs({ activeSource, onSourceChange }: SourceTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {VIDEO_SOURCES.map((source) => (
        <button
          key={source.id}
          onClick={() => onSourceChange(source.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeSource === source.id
              ? 'gradient-primary text-primary-foreground shadow-lg'
              : 'bg-secondary text-secondary-foreground hover:bg-muted'
          }`}
        >
          <span className="mr-1.5">{source.icon}</span>
          {source.name}
        </button>
      ))}
    </div>
  );
}
