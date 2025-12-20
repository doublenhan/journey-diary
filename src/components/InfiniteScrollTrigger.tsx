import { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export function InfiniteScrollTrigger({ onLoadMore, isLoading, hasMore }: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerRef.current || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoading && hasMore) {
          onLoadMore();
        }
      },
      {
        rootMargin: '200px', // Trigger 200px before reaching the element
        threshold: 0.1
      }
    );

    observer.observe(triggerRef.current);

    return () => observer.disconnect();
  }, [onLoadMore, isLoading, hasMore]);

  if (!hasMore) return null;

  return (
    <div 
      ref={triggerRef} 
      className="infinite-scroll-trigger"
      style={{
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '40px 0'
      }}
    >
      {isLoading && (
        <div className="flex items-center gap-3 text-pink-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <span className="text-sm font-medium">Đang tải thêm kỷ niệm...</span>
        </div>
      )}
    </div>
  );
}
