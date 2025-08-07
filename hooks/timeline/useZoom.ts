import { useState, useCallback, useEffect } from "react";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, BASE_ROW_HEIGHT } from "../../utils/timeline";

interface UseZoomResult {
  zoom: number;
}

/**
 * Custom hook for managing zoom state and wheel event handling in the timeline.
 * 
 * Features:
 * - Zoom in/out with Ctrl/Cmd + scroll wheel
 * - Maintains cursor position during zoom (zoom-to-cursor behavior)
 * - Respects zoom limits (MIN_ZOOM to MAX_ZOOM)
 * - Preserves scroll position relative to cursor location
 * - Automatically adjusts scroll position after zoom to keep content centered on cursor
 * 
 * @param containerRef A React ref to the timeline container element for event handling
 * @returns An object containing:
 *   - zoom: Current zoom level (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)
 * 
 * @example
 * ```tsx
 * const { zoom } = useZoom(containerRef);
 * const scaledRowHeight = BASE_ROW_HEIGHT * zoom;
 * ```
 */
export const useZoom = (containerRef: React.RefObject<HTMLDivElement>): UseZoomResult => {
  const [zoom, setZoom] = useState(1.0);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const cursorY = e.clientY - rect.top;

        const scrollTop = container.scrollTop;
        const oldRowHeight = BASE_ROW_HEIGHT * zoom;
        const cursorRowIndex = (scrollTop + cursorY) / oldRowHeight;

        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const oldZoom = zoom;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom + delta));

        if (newZoom !== oldZoom) {
          setZoom(newZoom);

          setTimeout(() => {
            if (containerRef.current) {
              const newRowHeight = BASE_ROW_HEIGHT * newZoom;
              const newScrollTop = cursorRowIndex * newRowHeight - cursorY;
              containerRef.current.scrollTop = Math.max(0, newScrollTop);
            }
          }, 0);
        }
      }
    },
    [zoom, containerRef]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel, containerRef]);

  return { zoom };
};

