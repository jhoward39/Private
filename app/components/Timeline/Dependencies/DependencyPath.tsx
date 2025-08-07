import React from "react";
import { TimelineTask } from "../../../../types";

/**
 * Props for the DependencyPath component.
 */
interface DependencyPathProps {
  /** A unique ID for the dependency, used for the React key. */
  id: string;
  /** The SVG path data string that defines the curve. */
  path: string;
  /** The source task object. */
  fromTask: TimelineTask;
  /** The target task object. */
  toTask: TimelineTask;
  /** The color of the dependency arrow, determined by theme. */
  strokeColor: string;
}

/**
 * Renders a single dependency arrow (a bezier curve) on the SVG layer.
 * It determines its own styling based on whether it is part of the critical path.
 *
 * @param {DependencyPathProps} props The props for the component.
 * @returns {JSX.Element} The rendered SVG path element.
 */
const DependencyPath: React.FC<DependencyPathProps> = ({
  id,
  path,
  fromTask,
  toTask,
  strokeColor,
}) => {
  // A dependency is on the critical path if both connected tasks are.
  const isCriticalPath = fromTask.isOnCriticalPath && toTask.isOnCriticalPath;

  return (
    <g key={id}>
      <path
        d={path}
        stroke={isCriticalPath ? "#D97706" : strokeColor}
        strokeWidth={isCriticalPath ? 3 : 2}
        fill="none"
        markerEnd={isCriticalPath ? "url(#critical-arrow-marker)" : "url(#arrow-marker)"}
      />
    </g>
  );
};

export default DependencyPath;

