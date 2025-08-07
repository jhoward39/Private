import { useState, useMemo, useEffect, useRef } from "react";
import { TimelineTask } from "../../types";
import { parseDate, formatDate, addDays, DateRow, getTaskCoordinates as getTaskCoordinatesUtil, Point } from "../../utils/timeline";

interface UseTimelineResult {
  dateRows: DateRow[];
  containerWidth: number;
  setContainerWidth: (width: number) => void;
  isCommandHeld: boolean;
  getTaskCoordinates: (task: TimelineTask) => Point | null;
}

/**
 * Custom hook for managing core timeline logic including date calculations and task positioning.
 * 
 * This hook handles:
 * - Date range calculation based on task due dates
 * - Container width tracking and updates
 * - Command/Ctrl key state management for modal interactions
 * - Scroll-to-today functionality on component mount
 * - Unified coordinate calculation for both HTML positioning and SVG dependency arrows
 * 
 * @param tasks An array of tasks to display on the timeline
 * @param containerRef A React ref to the timeline container element for width tracking
 * @param rowHeight The current height of each row (zoom-scaled)
 * @param setScrollTop A function to set the scroll top position (currently unused but kept for API consistency)
 * @returns An object containing:
 *   - dateRows: Array of date rows with associated tasks
 *   - containerWidth: Current width of the timeline container
 *   - setContainerWidth: Function to update container width
 *   - isCommandHeld: Boolean indicating if Cmd/Ctrl key is pressed
 *   - getTaskCoordinates: Function to get task center coordinates for positioning
 * 
 * @example
 * ```tsx
 * const { dateRows, getTaskCoordinates, isCommandHeld } = useTimeline(
 *   tasks, 
 *   containerRef, 
 *   BASE_ROW_HEIGHT * zoom, 
 *   setScrollTop
 * );
 * ```
 */
export const useTimeline = (
  tasks: TimelineTask[],
  containerRef: React.RefObject<HTMLDivElement>,
  rowHeight: number,
  setScrollTop: (scrollTop: number) => void
): UseTimelineResult => {
  const [containerWidth, setContainerWidth] = useState(800);
  const [isCommandHeld, setIsCommandHeld] = useState(false);
  const hasScrolledToToday = useRef(false);

  const { dateRows } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        startDate: addDays(today, -30),
        endDate: addDays(today, 30),
        dateRows: [],
      };
    }

    const dates = tasks.map((t) => parseDate(t.dueDate));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const start = addDays(minDate, -7);
    const end = addDays(maxDate, 7);

    const rows: DateRow[] = [];
    let current = new Date(start);

    while (current <= end) {
      const dateStr = formatDate(current);
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
      rows.push({
        date: new Date(current),
        dateStr,
        tasks: dayTasks,
      });
      current = addDays(current, 1);
    }

    return {
      startDate: start,
      endDate: end,
      dateRows: rows,
    };
  }, [tasks]);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, [tasks, containerRef]);

  useEffect(() => {
    if (containerRef.current && dateRows.length > 0 && !hasScrolledToToday.current) {
      const today = new Date();
      const todayIndex = dateRows.findIndex(
        (row) => row.date.toDateString() === today.toDateString(),
      );

      if (todayIndex >= 0) {
        const scrollTop = todayIndex * rowHeight - containerRef.current.clientHeight / 2;
        containerRef.current.scrollTop = Math.max(0, scrollTop);
        setScrollTop(containerRef.current.scrollTop);
        hasScrolledToToday.current = true;
      }
    }
  }, [dateRows, rowHeight, containerRef, setScrollTop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        setIsCommandHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        setIsCommandHeld(false);
      }
    };

    const handleWindowBlur = () => {
      setIsCommandHeld(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // Memoized function to get task coordinates with bound parameters
  const getTaskCoordinates = useMemo(
    () => (task: TimelineTask) => getTaskCoordinatesUtil(task, dateRows, rowHeight, containerWidth),
    [dateRows, rowHeight, containerWidth]
  );

  return { dateRows, containerWidth, setContainerWidth, isCommandHeld, getTaskCoordinates };
};

