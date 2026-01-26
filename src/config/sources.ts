export interface VideoSource {
  id: string;
  name: string;
  icon: string;
}

export const VIDEO_SOURCES: VideoSource[] = [
  { id: 'video1', name: 'Latest Videos', icon: '🔥' },
  { id: 'video2', name: 'OnlyFans', icon: '⭐' },
  // Add more sources here easily
  // { id: 'video3', name: 'Category Name', icon: '🎬' },
];
