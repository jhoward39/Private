import React from "react";
import { MINIMAP_WIDTH } from "../../../../utils/timeline";
import MinimapViewport from "./MinimapViewport";
import TaskDots from "./TaskDots";

/**
 * Represents a single dot on the minimap, corresponding to a date row with tasks.
 */
interface TaskDot {
  top: number;
  count: number;
}

/**
 * Props for the MinimapContainer component.
 */
interface MinimapContainerProps {
  /** Ref to the minimap container div. */
  minimapRef: React.RefObject<HTMLDivElement>;
  /** The calculated position and size of the viewport indicator. */
  minimapViewport: { top: number; height: number };
  /** An array of task dot data to be rendered on the minimap. */
  taskDots: TaskDot[];
  /** Event handler for mouse down events on the minimap. */
  handleMinimapMouseDown: (e: React.MouseEvent) => void;
  /** Event handler for mouse move events on the minimap. */
  handleMinimapMouseMove: (e: React.MouseEvent) => void;
  /** Event handler for mouse up events on the minimap. */
  handleMinimapMouseUp: () => void;
}

/**
 * Renders the minimap, including the timeline track, task dots, and viewport indicator.
 * It handles user interactions for navigating the main timeline.
 *
 * @param {MinimapContainerProps} props The props for the component.
 * @returns {JSX.Element} The rendered minimap container.
 */
const MinimapContainer: React.FC<MinimapContainerProps> = ({
  minimapRef,
  minimapViewport,
  taskDots,
  handleMinimapMouseDown,
  handleMinimapMouseMove,
  handleMinimapMouseUp,
}) => {
  return (
    <div
      ref={minimapRef}
      className="relative bg-[#FFFFF8] dark:bg-gray-900 cursor-pointer transition-colors duration-200 h-full"
      style={{ width: MINIMAP_WIDTH }}
      onMouseDown={handleMinimapMouseDown}
      onMouseMove={handleMinimapMouseMove}
      onMouseUp={handleMinimapMouseUp}
    >
      {/* Black timeline line */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 bg-black"
        style={{
          width: 2,
          top: 10,
          bottom: 10,
        }}
      ></div>

      {/* Task dots */}
      <TaskDots dots={taskDots} />

      {/* Current viewport indicator */}
      <MinimapViewport top={minimapViewport.top} height={minimapViewport.height} />
    </div>
  );
};

export default MinimapContainer;

