import { useEffect, useRef } from "react";

// Attach the returned ref to a sentinel element at the end of a list. When it
// scrolls into view `onLoadMore` fires — but only while `hasMore` is true and
// nothing is already loading, so it can't spam fetches.
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  hasMore,
  isLoading,
  onLoadMore
}: {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<T | null>(null);
  // Keep the latest callback without re-creating the observer each render.
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  return sentinelRef;
}
