import { Skeleton } from '@/components/ui/skeleton';

export function BookshelfSkeleton() {
  return (
    <div className="space-y-2">
      {/* Single shelf skeleton */}
      <div className="relative animate-fade-up">
        <div className="relative">
          {/* Books container */}
          <div className="flex items-end justify-start gap-2 sm:gap-3 px-4 pb-3 min-h-[10rem] sm:min-h-[12rem] md:min-h-[14rem]">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="flex-shrink-0"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div 
                  className="relative w-16 sm:w-20 md:w-24 h-32 sm:h-40 md:h-48"
                  style={{
                    perspective: '400px',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <Skeleton 
                    className="absolute inset-0 rounded-sm"
                    style={{
                      transform: 'rotateY(-20deg)',
                      transformOrigin: 'left center',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Wooden shelf skeleton */}
          <div className="relative h-4 sm:h-5 bg-gradient-to-b from-amber-800/50 via-amber-700/50 to-amber-900/50 dark:from-amber-900/30 dark:via-amber-800/30 dark:to-amber-950/30 rounded-sm">
            <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(0,0,0,0.1)_20px,rgba(0,0,0,0.1)_40px)]" />
          </div>
          
          {/* Shelf brackets */}
          <div className="absolute -bottom-3 left-4 w-3 h-6 bg-gradient-to-b from-amber-900/50 to-amber-950/50 rounded-b-sm" />
          <div className="absolute -bottom-3 right-4 w-3 h-6 bg-gradient-to-b from-amber-900/50 to-amber-950/50 rounded-b-sm" />
        </div>
      </div>
    </div>
  );
}

export function NoteCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}
