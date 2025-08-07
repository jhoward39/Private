import { useState, useMemo, useCallback, useEffect } from "react";
import { DateRow } from "../../utils/timeline";

interface MinimapViewport {
  top: number;
  height: number;
}

interface TaskDot {
  top: number;
  count: number;
}

interface UseMinimapResult {
  scrollTop: number;
  setScrollTop: (scrollTop: number) => void;
  minimapViewport: MinimapViewport;
  taskDots: TaskDot[];
  handleMinimapMouseDown: (e: React.MouseEvent) => void;
  handleMinimapMouseMove: (e: React.MouseEvent) => void;
  handleMinimapMouseUp: () => void;
}

/**
 * Custom hook for managing minimap navigation and viewport synchronization.
 * 
 * Features:
 * - Proportional viewport indicator that reflects current scroll position
 * - Task density visualization with dots sized by task count
 * - Click and drag navigation for quick timeline positioning
 * - Automatic viewport updates when timeline is scrolled externally
 * - Responsive resize handling to maintain accuracy
 * 
 * @param containerRef A React ref to the timeline container element for scroll tracking
 * @param minimapRef A React ref to the minimap container element for dimension calculations
 * @param totalHeight The total height of the timeline content (zoom-scaled)
 * @param dateRows An array of date rows containing all tasks for dot visualization
 * @param rowHeight The current height of each row (zoom-scaled)
 * @param setContainerWidth Function to update container width on resize events
 * @returns An object containing:
 *   - scrollTop: Current scroll position tracked by minimap
 *   - setScrollTop: Function to update scroll position (used by external scroll events)
 *   - minimapViewport: Calculated viewport indicator position and size
 *   - taskDots: Array of task dots with positions and counts for visualization
 *   - handleMinimapMouseDown: Mouse down handler for navigation clicks
 *   - handleMinimapMouseMove: Mouse move handler for drag navigation
 *   - handleMinimapMouseUp: Mouse up handler to end drag operations
 * 
 * @example
 * ```tsx
 * const { minimapViewport, taskDots, setScrollTop } = useMinimap(
 *   containerRef,
 *   minimapRef, 
 *   totalHeight,
 *   dateRows,
 *   rowHeight,
 *   setContainerWidth
 * );
 * ```
 */
export const useMinimap = (
  containerRef: React.RefObject<HTMLDivElement>,
  minimapRef: React.RefObject<HTMLDivElement>,
  totalHeight: number,
  dateRows: DateRow[],
  rowHeight: number,
  setContainerWidth: (width: number) => void
): UseMinimapResult => {
  const [minimapDragging, setMinimapDragging] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  const minimapViewport = useMemo(() => {
    if (!containerRef.current || !minimapRef.current || totalHeight === 0)
      return { top: 0, height: 0 };

    const container = containerRef.current;
    const minimap = minimapRef.current;
    const viewportHeight = container.clientHeight;
    const minimapHeight = minimap.clientHeight;

    const viewportRatio = viewportHeight / totalHeight;
    const maxScroll = Math.max(0, totalHeight - viewportHeight);
    const availableSpace = minimapHeight - 20;
    const indicatorHeight = Math.max(4, viewportRatio * availableSpace);
    const indicatorTravelSpace = availableSpace - indicatorHeight;
    const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const indicatorTop = 10 + scrollRatio * indicatorTravelSpace;

    return {
      top: indicatorTop,
      height: indicatorHeight,
    };
  }, [totalHeight, scrollTop, containerRef, minimapRef]);

  const taskDots = useMemo(() => {
    if (!minimapRef.current || totalHeight === 0) return [];

    const minimap = minimapRef.current;
    const minimapHeight = minimap.clientHeight;
    const availableHeight = minimapHeight - 20;
    const dots: Array<{ top: number; count: number }> = [];

    dateRows.forEach((row, index) => {
      if (row.tasks.length > 0) {
        const rowPosition = (index * rowHeight) / totalHeight;
        const dotTop = 10 + rowPosition * availableHeight;
        dots.push({ top: dotTop, count: row.tasks.length });
      }
    });

    return dots;
  }, [dateRows, rowHeight, totalHeight, minimapRef]);

  const handleMinimapMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setMinimapDragging(true);

      if (containerRef.current && minimapRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const viewportHeight = containerRef.current.clientHeight;
        const minimapHeight = minimapRef.current.clientHeight;
        const availableHeight = minimapHeight - 20;
        const scrollRatio = Math.max(0, Math.min(1, (y - 10) / availableHeight));
        const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
        const newScrollTop = scrollRatio * maxScrollTop;

        containerRef.current.scrollTop = Math.max(0, newScrollTop);
        setScrollTop(containerRef.current.scrollTop);
      }
    },
    [totalHeight, containerRef, minimapRef]
  );

  const handleMinimapMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!minimapDragging || !containerRef.current || !minimapRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const viewportHeight = containerRef.current.clientHeight;
      const minimapHeight = minimapRef.current.clientHeight;
      const availableHeight = minimapHeight - 20;
      const scrollRatio = Math.max(0, Math.min(1, (y - 10) / availableHeight));
      const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
      const newScrollTop = scrollRatio * maxScrollTop;

      containerRef.current.scrollTop = Math.max(0, newScrollTop);
      setScrollTop(containerRef.current.scrollTop);
    },
    [minimapDragging, totalHeight, containerRef, minimapRef]
  );

  const handleMinimapMouseUp = useCallback(() => {
    setMinimapDragging(false);
  }, []);

  useEffect(() => {
    if (minimapDragging) {
      const handleGlobalMouseUp = () => setMinimapDragging(false);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [minimapDragging]);

  useEffect(() => {
    const handleResize = () => {
      setScrollTop(containerRef.current?.scrollTop || 0);
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [containerRef, setContainerWidth]);

  return {
    scrollTop,
    setScrollTop,
    minimapViewport,
    taskDots,
    handleMinimapMouseDown,
    handleMinimapMouseMove,
    handleMinimapMouseUp,
  };
};

