import React from "react";
import { DateRow as DateRowType, Point } from "../../../../utils/timeline";
import { TimelineTask } from "../../../../types";
import DateRow from "./DateRow";

/**
 * Props for the TimelineContainer component.
 */
interface TimelineContainerProps {
  /** Ref to the main scrollable container div. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Array of date rows to be rendered in the timeline. */
  dateRows: DateRowType[];
  /** The total height of the timeline content, accounting for zoom. */
  totalHeight: number;
  /** The current height of a single date row, accounting for zoom. */
  rowHeight: number;
  /** The current width of a task node, accounting for zoom. */
  taskNodeWidth: number;
  /** The current height of a task node, accounting for zoom. */
  taskNodeHeight: number;
  /** The ID of the task currently being dragged. */
  draggedTask: number | null;
  /** The viewport position of the task being dragged. */
  draggedTaskPos: { x: number; y: number } | null;
  /** The index of the date row that is the current drop target. */
  dropTargetRowIndex: number;
  /** The ID of the task from which a new dependency is being created. */
  connectingFrom: number | null;
  /** Whether the Command (Mac) or Ctrl (Windows) key is currently held down. */
  isCommandHeld: boolean;
  /** A mutable ref to a Map storing references to each task's DOM element. */
  taskRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  /** Event handler for mouse down events on a task node. */
  handleTaskMouseDown: (e: React.MouseEvent, task: TimelineTask) => void;
  /** Event handler for right-click events on a task node for dependency creation. */
  handleTaskContextMenu: (e: React.MouseEvent, task: TimelineTask) => void;
  /** Function to get task coordinates for positioning and dependency arrows. */
  getTaskCoordinates: (task: TimelineTask) => Point | null;
  /** Event handler for mouse move events on the timeline container. */
  handleMouseMove: (e: React.MouseEvent) => void;
  /** Event handler for mouse up events on the timeline container. */
  handleMouseUp: () => void;
  /** Event handler for clicks on the timeline container (used to cancel actions). */
  handleTimelineClick: (e: React.MouseEvent) => void;
  /** Event handler to prevent the default context menu. */
  handleContextMenu: (e: React.MouseEvent) => void;
  /** Event handler for scroll events on the timeline container. */
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** The children to render inside the container, e.g., the dependency layer. */
  children: React.ReactNode;
}

/**
 * Renders the main scrollable container for the timeline, including date rows and tasks.
 * It is responsible for the overall layout and delegating mouse and scroll events.
 * 
 * This component acts as the central coordination point for timeline interactions:
 * - Handles scroll events for minimap synchronization
 * - Delegates mouse events (move, up, down) for drag operations
 * - Manages click events for task selection and dependency creation
 * - Prevents default context menus to enable custom right-click behavior
 * - Renders date rows with proper key management for performance
 * 
 * Performance Considerations:
 * - Uses React keys on DateRow components for efficient re-rendering
 * - Children (like DependencyLayer) are rendered first to maintain proper z-order
 * - Event handlers are passed down as props to avoid re-creating functions
 * - Container dimensions are managed via props to prevent unnecessary recalculations
 * 
 * @param {TimelineContainerProps} props The props for the component.
 * @returns {JSX.Element} The rendered timeline container with all date rows and event handling.
 */
const TimelineContainer: React.FC<TimelineContainerProps> = ({
  containerRef,
  dateRows,
  totalHeight,
  rowHeight,
  taskNodeWidth,
  taskNodeHeight,
  draggedTask,
  draggedTaskPos,
  dropTargetRowIndex,
  connectingFrom,
  isCommandHeld,
  taskRefs,
  handleTaskMouseDown,
  handleTaskContextMenu,
  getTaskCoordinates,
  handleMouseMove,
  handleMouseUp,
  handleTimelineClick,
  handleContextMenu,
  handleScroll,
  children,
}) => {
  return (
    <div
      className="relative h-full overflow-y-auto overflow-x-hidden scrollbar-hide"
      style={{ 
        width: `calc(100vw - 40px)`,
        // Hide scrollbar but keep functionality
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none' // IE and Edge
      }}
      ref={containerRef}
      onScroll={handleScroll}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleTimelineClick}
      onContextMenu={handleContextMenu}
    >
      {/* Children are rendered first to appear underneath, e.g., SVG layer */}
      {children}

      {/* Date rows container */}
      <div
        style={{
          height: totalHeight,
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {dateRows.map((row, index) => {
          // Performance note: today calculation could be memoized if dateRows is large
          const today = new Date().toISOString().split("T")[0];
          const isToday = row.dateStr === today;
          return (
            <DateRow
              key={row.dateStr}
              row={row}
              isToday={isToday}
              dropTargetRowIndex={dropTargetRowIndex}
              index={index}
              rowHeight={rowHeight}
              taskNodeWidth={taskNodeWidth}
              taskNodeHeight={taskNodeHeight}
              draggedTask={draggedTask}
              draggedTaskPos={draggedTaskPos}
              connectingFrom={connectingFrom}
              isCommandHeld={isCommandHeld}
              taskRefs={taskRefs}
              handleTaskMouseDown={handleTaskMouseDown}
              handleTaskContextMenu={handleTaskContextMenu}
              getTaskCoordinates={getTaskCoordinates}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TimelineContainer;
