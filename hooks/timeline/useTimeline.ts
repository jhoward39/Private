import { useState, useMemo, useEffect, useRef } from "react";
import { TimelineTask } from "../../types";
import { parseDate, formatDate, addDays, DateRow } from "../../utils/timeline";

interface UseTimelineResult {
  dateRows: DateRow[];
  containerWidth: number;
  setContainerWidth: (width: number) => void;
  isCommandHeld: boolean;
}

/**
 * Custom hook for managing core timeline logic.
 * @param tasks An array of tasks to display on the timeline.
 * @param containerRef A React ref to the timeline container element.
 * @param rowHeight The current height of each row.
 * @param setScrollTop A function to set the scroll top position of the timeline container.
 * @returns An object with the calculated date rows, container width, and command key status.
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

  return { dateRows, containerWidth, setContainerWidth, isCommandHeld };
};

