import React from "react";
import { DateRow as DateRowType, Point } from "../../../../utils/timeline";
import { TimelineTask } from "../../../../types";
import TaskNode from "./TaskNode";

/**
 * Props for the DateRow component.
 */
interface DateRowProps {
  /** The data for the row, including the date and tasks. */
  row: DateRowType;
  /** Whether this row represents today's date. */
  isToday: boolean;
  /** The index of the row that is currently the drop target. */
  dropTargetRowIndex: number;
  /** The index of this row. */
  index: number;
  /** The current height of a row. */
  rowHeight: number;
  /** The current width of a task node. */
  taskNodeWidth: number;
  /** The current height of a task node. */
  taskNodeHeight: number;
  /** The ID of the task currently being dragged, or null if none. */
  draggedTask: number | null;
  /** The current position of the dragged task. */
  draggedTaskPos: Point | null;
  /** The ID of the task from which a dependency is being created, or null. */
  connectingFrom: number | null;
  /** Whether the Command/Ctrl key is currently held down. */
  isCommandHeld: boolean;
  /** A ref to a map of task elements for positioning. */
  taskRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  /** An event handler for when a task is clicked or dragged. */
  handleTaskMouseDown: (e: React.MouseEvent, task: TimelineTask) => void;
  /** Event handler for right-click events on a task node for dependency creation. */
  handleTaskContextMenu: (e: React.MouseEvent, task: TimelineTask) => void;
  /** Function to get task coordinates for positioning and dependency arrows. */
  getTaskCoordinates: (task: TimelineTask) => Point | null;
}

/**
 * Renders a single row in the timeline, representing a specific date.
 * It displays the date label and contains all the TaskNode components for that date.
 */
const DateRow: React.FC<DateRowProps> = ({
  row,
  isToday,
  dropTargetRowIndex,
  index,
  rowHeight,
  taskNodeWidth,
  taskNodeHeight,
  draggedTask,
  draggedTaskPos,
  connectingFrom,
  isCommandHeld,
  taskRefs,
  handleTaskMouseDown,
  handleTaskContextMenu,
  getTaskCoordinates,
}) => {
  return (
    <div
      key={row.dateStr}
      className={`relative flex items-center transition-colors duration-200 ${
        isToday
          ? "border-t-2 border-b-2 border-t-blue-600 border-b-blue-600 dark:border-t-blue-400 dark:border-b-blue-400"
          : "border-b border-gray-200 dark:border-gray-700"
      } ${
        draggedTask !== null && dropTargetRowIndex === index
          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600"
          : ""
      }`}
      style={{
        height: rowHeight,
        marginLeft: 40,
        marginRight: "32px",
        width: `calc(100% - 40px - 32px)`,
      }}
    >
      <div
        className={`absolute left-4 top-2 text-sm font-medium transition-colors duration-200 ${
          isToday
            ? "text-blue-900 dark:text-blue-900"
            : "text-gray-600 dark:text-gray-400"
        }`}
      >
        {row.date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </div>

      {row.tasks.map((task) => {
        const coords = getTaskCoordinates(task);
        if (!coords) return null;

        return (
          <TaskNode
            key={task.id}
            task={task}
            taskCoords={coords}
            taskRefs={taskRefs}
            isCommandHeld={isCommandHeld}
            draggedTask={draggedTask}
            draggedTaskPos={draggedTaskPos}
            connectingFrom={connectingFrom}
            handleTaskMouseDown={handleTaskMouseDown}
            handleTaskContextMenu={handleTaskContextMenu}
            taskNodeWidth={taskNodeWidth}
            taskNodeHeight={taskNodeHeight}
            rowHeight={rowHeight}
          />
        );
      })}
    </div>
  );
};

export default DateRow;

