import React, { useMemo } from "react";
import { TimelineTask, TimelineDependency } from "../../../../types";
import { useTheme } from "../../../contexts/ThemeContext";
import DependencyPath from "./DependencyPath";
import {
  getBoxEdgePointWithDirection,
  MINIMAP_WIDTH,
} from "../../../../utils/timeline";
import { useTimeline } from "../../../../hooks/timeline";


/**
 * Represents the data required to render a single dependency path.
 */
interface DependencyPathData {
  id: string;
  path: string;
  fromTask: TimelineTask;
  toTask: TimelineTask;
}

/**
 * Props for the DependencyLayer component.
 */
interface DependencyLayerProps {
  tasks: TimelineTask[];
  dependencies: TimelineDependency[];
  getTaskCoordinates: ReturnType<typeof useTimeline>["getTaskCoordinates"];
  containerWidth: number;
  totalHeight: number;
  zoom: number;
}

/**
 * Renders the SVG layer that displays dependency arrows between tasks.
 * It calculates the paths for these arrows, including collision avoidance with other tasks.
 *
 * @param {DependencyLayerProps} props The props for the component.
 * @returns {JSX.Element} The rendered SVG layer for dependencies.
 */
const DependencyLayer: React.FC<DependencyLayerProps> = ({
  tasks,
  dependencies,
  getTaskCoordinates,
  containerWidth,
  totalHeight,
  zoom,
}) => {
  const { isDark } = useTheme();

  const dependencyPaths: DependencyPathData[] = useMemo(() => {
    return dependencies
      .map((dep, index) => {
        const fromTask = tasks.find((t) => t.id === dep.fromId);
        const toTask = tasks.find((t) => t.id === dep.toId);

        if (!fromTask || !toTask) return null;

        const fromCoords = getTaskCoordinates(fromTask);
        const toCoords = getTaskCoordinates(toTask);

        if (!fromCoords || !toCoords) return null;

        // The coordinates are already relative to the timeline container,
        // so we don't need to add the minimap width again here.
        const TEMP_VISUAL_OFFSET = 16; // A guess to counteract suspected container padding
        const fromCenter = { x: fromCoords.x + MINIMAP_WIDTH - TEMP_VISUAL_OFFSET, y: fromCoords.y };
        const toCenter = { x: toCoords.x + MINIMAP_WIDTH - TEMP_VISUAL_OFFSET, y: toCoords.y };

        const fromEdgeInfo = getBoxEdgePointWithDirection(
          fromCenter.x,
          fromCenter.y,
          toCenter.x,
          toCenter.y,
          zoom,
          true
        );
        const toEdgeInfo = getBoxEdgePointWithDirection(
          toCenter.x,
          toCenter.y,
          fromCenter.x,
          fromCenter.y,
          zoom,
          false
        );

        const controlDistance = Math.max(
          50 * zoom,
          Math.abs(toEdgeInfo.point.x - fromEdgeInfo.point.x) * 0.3,
          Math.abs(toEdgeInfo.point.y - fromEdgeInfo.point.y) * 0.3
        );

        const curve1X = fromEdgeInfo.point.x + fromEdgeInfo.direction.x * controlDistance;
        const curve1Y = fromEdgeInfo.point.y + fromEdgeInfo.direction.y * controlDistance;
        const curve2X = toEdgeInfo.point.x + toEdgeInfo.direction.x * controlDistance;
        const curve2Y = toEdgeInfo.point.y + toEdgeInfo.direction.y * controlDistance;

        const path = `M ${fromEdgeInfo.point.x} ${fromEdgeInfo.point.y} C ${curve1X} ${curve1Y} ${curve2X} ${curve2Y} ${toEdgeInfo.point.x} ${toEdgeInfo.point.y}`;

        return {
          id: `dep-${index}`,
          path,
          fromTask,
          toTask,
        };
      })
      .filter((p): p is DependencyPathData => p !== null);
  }, [dependencies, tasks, getTaskCoordinates, zoom]);

  const strokeColor = isDark ? "#9CA3AF" : "#6B7280";

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        left: 0,
        top: 0,
        width: "100%",
        height: totalHeight,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${containerWidth} ${totalHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          <marker
            id="arrow-marker"
            viewBox="0 0 10 10"
            refX="3"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill={strokeColor} />
          </marker>
          <marker
            id="critical-arrow-marker"
            viewBox="0 0 10 10"
            refX="3"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#D97706" />
          </marker>
        </defs>

        {dependencyPaths.map((dep) => (
          <DependencyPath
            key={dep.id}
            id={dep.id}
            path={dep.path}
            fromTask={dep.fromTask}
            toTask={dep.toTask}
            strokeColor={strokeColor}
          />
        ))}
      </svg>
    </div>
  );
};

export default DependencyLayer;
