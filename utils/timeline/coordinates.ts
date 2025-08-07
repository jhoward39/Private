import { TimelineTask } from "../../types";
import { MINIMAP_WIDTH, TASK_NODE_WIDTH, TASK_NODE_HEIGHT } from "./constants";

export interface DateRow {
  date: Date;
  dateStr: string;
  tasks: TimelineTask[];
}

export interface Point {
  x: number;
  y: number;
}

export interface EdgePointWithDirection {
  point: Point;
  direction: Point;
}

/**
 * Calculates the absolute x and y coordinates for a given task within the timeline.
 * @param task The task to calculate coordinates for.
 * @param dateRows An array of date rows containing all tasks.
 * @param rowHeight The current height of each row.
 * @param containerWidth The width of the timeline container.
 * @returns An object with x and y coordinates, or null if the task's row is not found.
 */
export const getTaskCoordinates = (
  task: TimelineTask,
  dateRows: DateRow[],
  rowHeight: number,
  containerWidth: number
): Point | null => {
  const row = dateRows.find((row) => row.tasks.some((t) => t.id === task.id));
  if (!row) return null;

  const rowIndex = dateRows.indexOf(row);
  const taskIndex = row.tasks.findIndex((t) => t.id === task.id);

  const availableWidth = containerWidth - MINIMAP_WIDTH - 32;

  let taskX: number;
  if (row.tasks.length === 1) {
    taskX = availableWidth / 2;
  } else {
    const spacing = availableWidth / (row.tasks.length + 1);
    taskX = spacing * (taskIndex + 1);
  }

  const absoluteX = MINIMAP_WIDTH + taskX;
  const absoluteY = rowIndex * rowHeight + rowHeight / 2;

  return { x: absoluteX, y: absoluteY };
};

/**
 * Calculates the connection point on the edge of a task node for a dependency line.
 * @param centerX The center X coordinate of the task node.
 * @param centerY The center Y coordinate of the task node.
 * @param targetX The center X coordinate of the target task node.
 * @param targetY The center Y coordinate of the target task node.
 * @param zoom The current zoom level.
 * @param isSource Whether this is the source task of the dependency.
 * @returns An object with the connection point and the direction vector.
 */
export const getBoxEdgePointWithDirection = (
  centerX: number,
  centerY: number,
  targetX: number,
  targetY: number,
  zoom: number,
  isSource: boolean
): EdgePointWithDirection => {
  const halfWidth = (TASK_NODE_WIDTH * zoom) / 2;
  const halfHeight = (TASK_NODE_HEIGHT * zoom) / 2;
  const arrowLength = 9;

  const dx = targetX - centerX;
  const dy = targetY - centerY;

  if (Math.abs(dy) > 10) {
    if (isSource) {
      if (dy > 0) {
        return {
          point: { x: centerX, y: centerY + halfHeight },
          direction: { x: 0, y: 1 },
        };
      } else {
        return {
          point: { x: centerX, y: centerY - halfHeight },
          direction: { x: 0, y: -1 },
        };
      }
    } else {
      if (dy < 0) {
        return {
          point: { x: centerX, y: centerY - halfHeight - arrowLength },
          direction: { x: 0, y: -1 },
        };
      } else {
        return {
          point: { x: centerX, y: centerY + halfHeight + arrowLength },
          direction: { x: 0, y: 1 },
        };
      }
    }
  } else {
    if (isSource) {
      if (dx > 0) {
        return {
          point: { x: centerX + halfWidth, y: centerY },
          direction: { x: 1, y: 0 },
        };
      } else {
        return {
          point: { x: centerX - halfWidth, y: centerY },
          direction: { x: -1, y: 0 },
        };
      }
    } else {
      if (dx < 0) {
        return {
          point: { x: centerX - halfWidth - arrowLength, y: centerY },
          direction: { x: -1, y: 0 },
        };
      } else {
        return {
          point: { x: centerX + halfWidth + arrowLength, y: centerY },
          direction: { x: 1, y: 0 },
        };
      }
    }
  }
};

