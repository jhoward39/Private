import { TimelineTask } from "../../types";
import { Point } from "./coordinates";
import { TASK_NODE_WIDTH, TASK_NODE_HEIGHT } from "./constants";

/**
 * Represents a rectangle with top, left, right, and bottom coordinates.
 */
interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Checks if two line segments intersect.
 * @param x1 Start x-coordinate of line 1.
 * @param y1 Start y-coordinate of line 1.
 * @param x2 End x-coordinate of line 1.
 * @param y2 End y-coordinate of line 1.
 * @param x3 Start x-coordinate of line 2.
 * @param y3 Start y-coordinate of line 2.
 * @param x4 End x-coordinate of line 2.
 * @param y4 End y-coordinate of line 2.
 * @returns True if the line segments intersect, false otherwise.
 */
const lineSegmentsIntersect = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean => {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return false;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

/**
 * Checks if a line segment intersects with a rectangle.
 * @param x1 The x-coordinate of the start of the line.
 * @param y1 The y-coordinate of the start of the line.
 * @param x2 The x-coordinate of the end of the line.
 * @param y2 The y-coordinate of the end of the line.
 * @param left The left coordinate of the rectangle.
 * @param top The top coordinate of the rectangle.
 * @param right The right coordinate of the rectangle.
 * @param bottom The bottom coordinate of the rectangle.
 * @returns True if the line intersects the rectangle, false otherwise.
 */
const lineIntersectsRect = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  { left, top, right, bottom }: Rect
): boolean => {
  if (
    (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) ||
    (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom)
  ) {
    return true;
  }

  return (
    lineSegmentsIntersect(x1, y1, x2, y2, left, top, right, top) ||
    lineSegmentsIntersect(x1, y1, x2, y2, right, top, right, bottom) ||
    lineSegmentsIntersect(x1, y1, x2, y2, right, bottom, left, bottom) ||
    lineSegmentsIntersect(x1, y1, x2, y2, left, bottom, left, top)
  );
};

/**
 * Checks if a line segment intersects with a task node.
 * @param x1 The x-coordinate of the start of the line.
 * @param y1 The y-coordinate of the start of the line.
 * @param x2 The x-coordinate of the end of the line.
 * @param y2 The y-coordinate of the end of the line.
 * @param task The task to check for intersection with.
 * @param taskCoords The coordinates of the task.
 * @param zoom The current zoom level.
 * @returns True if the line intersects the task, false otherwise.
 */
export const doesLineIntersectTask = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  task: TimelineTask,
  taskCoords: Point,
  zoom: number
): boolean => {
  const halfWidth = (TASK_NODE_WIDTH * zoom) / 2;
  const halfHeight = (TASK_NODE_HEIGHT * zoom) / 2;

  const rect: Rect = {
    left: taskCoords.x - halfWidth,
    right: taskCoords.x + halfWidth,
    top: taskCoords.y - halfHeight,
    bottom: taskCoords.y + halfHeight,
  };

  return lineIntersectsRect(x1, y1, x2, y2, rect);
};
