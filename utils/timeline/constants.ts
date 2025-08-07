/**
 * Timeline component constants
 * These values are used for layout, zoom, and interaction calculations
 */

/**
 * The base height of each date row in the timeline, in pixels.
 * @type {number}
 */
export const BASE_ROW_HEIGHT = 80;

/**
 * The minimum zoom level for the timeline.
 * @type {number}
 */
export const MIN_ZOOM = 0.5;

/**
 * The maximum zoom level for the timeline.
 * @type {number}
 */
export const MAX_ZOOM = 2.0;

/**
 * The amount to increment or decrement the zoom level with each step.
 * @type {number}
 */
export const ZOOM_STEP = 0.1;

/**
 * The width of each task node in the timeline, in pixels.
 * @type {number}
 */
export const TASK_NODE_WIDTH = 120;

/**
 * The height of each task node in the timeline, in pixels.
 * @type {number}
 */
export const TASK_NODE_HEIGHT = 40;

/**
 * The width of the minimap, in pixels.
 * @type {number}
 */
export const MINIMAP_WIDTH = 40;
