import { useState, useCallback, useMemo } from "react";
import { Point, DateRow } from "../../utils/timeline";
import { TimelineTask } from "../../types";

interface UseDragResult {
  draggedTask: number | null;
  draggedTaskPos: Point | null;
  connectingFrom: number | null;
  setConnectingFrom: (id: number | null) => void;
  dependencyError: string | null;
  setDependencyError: (error: string | null) => void;
  handleTaskMouseDown: (e: React.MouseEvent, task: TimelineTask) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  dropTargetRowIndex: number;
}

/**
 * Custom hook for managing task drag and drop functionality with visual feedback.
 * 
 * Features:
 * - Smooth task dragging with mouse position tracking
 * - Visual feedback during drag (opacity, shadow, size changes)
 * - Drop target highlighting on date rows
 * - Dependency creation state management
 * - Error handling for dependency operations
 * - Automatic state cleanup on drag completion
 * 
 * @param containerRef A React ref to the timeline container element for coordinate calculations
 * @param rowHeight The current height of each row (zoom-scaled)
 * @param dateRows An array of date rows containing all tasks for drop target calculation
 * @param onTaskMove Callback function when a task is moved to a new date
 * @param onCreateDependency Async callback for creating dependencies between tasks
 * @param setSelectedTask Function to set the currently selected task for modal display
 * @param setShowTaskModal Function to show or hide the task modal
 * @returns An object containing:
 *   - draggedTask: ID of currently dragged task (null if none)
 *   - draggedTaskPos: Current mouse position during drag
 *   - connectingFrom: ID of task selected for dependency creation
 *   - setConnectingFrom: Function to set dependency source task
 *   - dependencyError: Error message from failed dependency creation
 *   - setDependencyError: Function to set dependency error message
 *   - handleTaskMouseDown: Mouse down handler for starting drag operations
 *   - handleMouseMove: Mouse move handler for drag position tracking
 *   - handleMouseUp: Mouse up handler for completing drag operations
 *   - dropTargetRowIndex: Index of row currently highlighted as drop target
 * 
 * @example
 * ```tsx
 * const { draggedTask, handleTaskMouseDown, dropTargetRowIndex } = useDrag(
 *   containerRef,
 *   rowHeight,
 *   dateRows,
 *   onTaskMove,
 *   onCreateDependency,
 *   setSelectedTask,
 *   setShowTaskModal
 * );
 * ```
 */
export const useDrag = (
  containerRef: React.RefObject<HTMLDivElement>,
  rowHeight: number,
  dateRows: DateRow[],
  onTaskMove: (taskId: number, newDate: string) => void,
  onCreateDependency: (fromId: number, toId: number) => Promise<{ success: boolean; error?: string }>,
  setSelectedTask: (task: TimelineTask) => void,
  setShowTaskModal: (show: boolean) => void
): UseDragResult => {
  const [draggedTask, setDraggedTask] = useState<number | null>(null);
  const [draggedTaskPos, setDraggedTaskPos] = useState<Point | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
  const [dependencyError, setDependencyError] = useState<string | null>(null);

  const handleTaskMouseDown = useCallback(
    (e: React.MouseEvent, task: TimelineTask) => {
      if (e.button === 0) {
        e.preventDefault();
        e.stopPropagation();

        if (e.metaKey || e.ctrlKey) {
          setSelectedTask(task);
          setShowTaskModal(true);
          return;
        }

        setDraggedTask(task.id);
        setDraggedTaskPos({ x: e.clientX, y: e.clientY });
      } else if (e.button === 2) {
        e.preventDefault();
        if (connectingFrom === null) {
          setConnectingFrom(task.id);
          setDependencyError(null);
        } else if (connectingFrom !== task.id) {
          onCreateDependency(connectingFrom, task.id).then((result) => {
            if (result.success) {
              setConnectingFrom(null);
              setDependencyError(null);
            } else {
              setDependencyError(result.error || "Failed to create dependency.");
            }
          });
        }
      }
    },
    [connectingFrom, onCreateDependency, setSelectedTask, setShowTaskModal]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedTask !== null) {
        setDraggedTaskPos({ x: e.clientX, y: e.clientY });
      }
    },
    [draggedTask]
  );

  const handleMouseUp = useCallback(() => {
    if (draggedTask !== null && containerRef.current && draggedTaskPos) {
      const rect = containerRef.current.getBoundingClientRect();
      const containerY = draggedTaskPos.y - rect.top;
      const scrollTop = containerRef.current.scrollTop;

      const taskCenterY = containerY + scrollTop;
      const dropRowIndex = Math.floor(taskCenterY / rowHeight);
      const clampedRowIndex = Math.max(0, Math.min(dateRows.length - 1, dropRowIndex));

      const targetDate = dateRows[clampedRowIndex]?.dateStr;
      if (targetDate) {
        onTaskMove(draggedTask, targetDate);
      }
    }

    setDraggedTask(null);
    setDraggedTaskPos(null);
  }, [draggedTask, draggedTaskPos, rowHeight, dateRows, onTaskMove, containerRef]);

  const dropTargetRowIndex = useMemo(() => {
    if (draggedTask === null || !draggedTaskPos || !containerRef.current) return -1;

    const rect = containerRef.current.getBoundingClientRect();
    const containerY = draggedTaskPos.y - rect.top;
    const scrollTop = containerRef.current.scrollTop;
    const taskCenterY = containerY + scrollTop;
    const rowIndex = Math.floor(taskCenterY / rowHeight);
    return Math.max(0, Math.min(dateRows.length - 1, rowIndex));
  }, [draggedTask, draggedTaskPos, rowHeight, dateRows, containerRef]);

  return {
    draggedTask,
    draggedTaskPos,
    connectingFrom,
    setConnectingFrom,
    dependencyError,
    setDependencyError,
    handleTaskMouseDown,
    handleMouseMove,
    handleMouseUp,
    dropTargetRowIndex,
  };
};

