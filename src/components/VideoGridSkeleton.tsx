import { Skeleton } from '@/components/ui/skeleton';

export function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden bg-card">
          <Skeleton className="aspect-video w-full" />
          <div className="p-3">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
