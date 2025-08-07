import React from "react";
import { TimelineTask } from "../../../../types";
import { Point, MINIMAP_WIDTH } from "../../../../utils/timeline";

/**
 * Props for the TaskNode component.
 */
interface TaskNodeProps {
  /** The task data to render. */
  task: TimelineTask;
  /** The pre-calculated coordinates for the task node. */
  taskCoords: Point;
  /** A ref to a map of task elements for positioning. */
  taskRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  /** Whether the Command/Ctrl key is currently held down. */
  isCommandHeld: boolean;
  /** The ID of the task currently being dragged, or null if none. */
  draggedTask: number | null;
  /** The current position of the dragged task. */
  draggedTaskPos: Point | null;
  /** The ID of the task from which a dependency is being created, or null. */
  connectingFrom: number | null;
  /** An event handler for when a task is clicked or dragged. */
  handleTaskMouseDown: (e: React.MouseEvent, task: TimelineTask) => void;
  /** Event handler for right-click events on a task node for dependency creation. */
  handleTaskContextMenu: (e: React.MouseEvent, task: TimelineTask) => void;
  /** The current width of a task node. */
  taskNodeWidth: number;
  /** The current height of a task node. */
  taskNodeHeight: number;
  /** The current height of a row. */
  rowHeight: number;
}

/**
 * Renders a single task node within the timeline.
 * Handles drag and drop, dependency connections, and modal interactions.
 */
const TaskNode: React.FC<TaskNodeProps> = ({
  task,
  taskCoords,
  taskRefs,
  isCommandHeld,
  draggedTask,
  draggedTaskPos,
  connectingFrom,
  handleTaskMouseDown,
  handleTaskContextMenu,
  taskNodeWidth,
  taskNodeHeight,
  rowHeight,
}) => {
  return (
    <div
      ref={(el) => {
        if (el) taskRefs.current.set(task.id, el);
        else taskRefs.current.delete(task.id);
      }}
      key={task.id}
      data-task-id={task.id}
      className={`absolute bg-blue-100 dark:bg-blue-800 border border-blue-300 dark:border-blue-600 rounded px-2 py-1 select-none text-xs transition-colors duration-200 flex items-center justify-center ${
        isCommandHeld ? "cursor-pointer" : "cursor-move"
      } ${
        draggedTask === task.id
          ? "opacity-80 shadow-lg bg-blue-200 dark:bg-blue-700 border-blue-400 dark:border-blue-500"
          : ""
      } ${connectingFrom === task.id ? "ring-2 ring-orange-400" : ""}`}
      style={{
        left:
          draggedTask === task.id && draggedTaskPos
            ? draggedTaskPos.x - (taskNodeWidth * 0.9) / 2
            : taskCoords.x + MINIMAP_WIDTH - taskNodeWidth / 2, // Add MINIMAP_WIDTH offset
        top:
          draggedTask === task.id && draggedTaskPos
            ? draggedTaskPos.y - (taskNodeHeight * 0.9) / 2
            : (rowHeight - taskNodeHeight) / 2,
        width: draggedTask === task.id ? taskNodeWidth * 0.9 : taskNodeWidth,
        height: draggedTask === task.id ? taskNodeHeight * 0.9 : taskNodeHeight,
        zIndex: draggedTask === task.id ? 1000 : 1,
        pointerEvents: draggedTask === task.id ? "none" : "auto",
        transform: "none",
        transition: draggedTask === task.id ? "none" : "all 0.2s ease",
        position: draggedTask === task.id ? "fixed" : "absolute",
      }}
      onMouseDown={(e) => handleTaskMouseDown(e, task)}
      onContextMenu={(e) => handleTaskContextMenu(e, task)}
    >
      <div
        className={`font-medium text-center leading-tight truncate ${
          task.done
            ? "line-through text-gray-500 dark:text-gray-500"
            : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {task.title}
      </div>
    </div>
  );
};

export default TaskNode;

