"use client";

import React, { useState, useEffect, useRef } from "react";
import { VerticalTimelineProps, TimelineTask } from "../../../types";
import TaskModal from "../TaskModal";
import MinimapContainer from "./Minimap/MinimapContainer";
import TimelineContainer from "./Core/TimelineContainer";
import DependencyLayer from "./Dependencies/DependencyLayer";
import {
  useZoom,
  useDrag,
  useMinimap,
  useTimeline,
} from "../../../hooks/timeline";
import { BASE_ROW_HEIGHT, TASK_NODE_WIDTH, TASK_NODE_HEIGHT } from "../../../utils/timeline";

/**
 * The main component for the vertical timeline. It orchestrates all the subcomponents,
 * custom hooks, and state management to render an interactive timeline.
 * 
 * This is the primary entry point for the refactored timeline system, replacing the monolithic
 * VerticalTimeline component. It coordinates:
 * 
 * **Architecture Overview:**
 * - **Core Components**: TimelineContainer with DateRow and TaskNode components
 * - **Feature Components**: MinimapContainer with navigation and DependencyLayer with SVG arrows
 * - **Custom Hooks**: useTimeline, useZoom, useDrag, useMinimap for state management
 * - **Utilities**: Timeline constants, date utils, coordinates, and geometry calculations
 * 
 * **Component Relationship Diagram:**
 * ```
 * Timeline (index.tsx) - Main orchestrator
 * ├── Custom Hooks
 * │   ├── useTimeline() - Core logic, date calculations, coordinates
 * │   ├── useZoom() - Zoom state and wheel events
 * │   ├── useDrag() - Drag/drop, dependency creation
 * │   └── useMinimap() - Navigation, viewport tracking
 * │
 * ├── MinimapContainer - Left sidebar navigation
 * │   ├── MinimapViewport - Draggable viewport indicator
 * │   └── TaskDots - Task density visualization
 * │
 * ├── TimelineContainer - Main scrollable area
 * │   └── DateRow[] - One per date
 * │       └── TaskNode[] - Individual tasks
 * │
 * ├── DependencyLayer - SVG overlay for arrows
 * │   └── DependencyPath[] - Individual dependency arrows
 * │
 * └── TaskModal - Task editing (conditional)
 * 
 * Data Flow:
 * Timeline → useTimeline → getTaskCoordinates() → TaskNode (HTML positioning)
 *                                              └→ DependencyLayer (SVG arrows)
 * 
 * Event Flow:
 * TaskNode.onMouseDown → useDrag → Timeline.handleTaskMouseDown → drag state
 * TaskNode.onContextMenu → Timeline.handleTaskContextMenu → dependency creation
 * TimelineContainer.onScroll → useMinimap.setScrollTop → viewport sync
 * ```
 * 
 * **Key Features:**
 * - Interactive task drag and drop with visual feedback
 * - Zoom functionality with Ctrl/Cmd + scroll wheel
 * - Minimap navigation with viewport indicator
 * - Dependency creation via right-click interactions
 * - Task modal for editing with Cmd/Ctrl + click
 * - Theme-aware styling with dark/light mode support
 * - Critical path visualization for project management
 * 
 * **Event Handling:**
 * - Drag operations: Task repositioning between dates
 * - Dependency creation: Right-click source, right-click target
 * - Task selection: Cmd/Ctrl + click opens modal
 * - Zoom: Ctrl/Cmd + scroll wheel
 * - Navigation: Minimap click and drag
 * 
 * @param {VerticalTimelineProps} props The props for the component.
 * @returns {JSX.Element} The rendered vertical timeline with all interactive features.
 * 
 * @example
 * Basic usage with task management:
 * ```tsx
 * import Timeline from './components/Timeline';
 * 
 * function MyApp() {
 *   const [tasks, setTasks] = useState<TimelineTask[]>([]);
 *   const [dependencies, setDependencies] = useState<TimelineDependency[]>([]);
 * 
 *   const handleTaskMove = (taskId: number, newDate: string) => {
 *     // Update task due date
 *     setTasks(prev => prev.map(task => 
 *       task.id === taskId ? { ...task, dueDate: newDate } : task
 *     ));
 *   };
 * 
 *   const handleCreateDependency = async (fromId: number, toId: number) => {
 *     try {
 *       await api.createDependency(fromId, toId);
 *       return { success: true };
 *     } catch (error) {
 *       return { success: false, error: error.message };
 *     }
 *   };
 * 
 *   return (
 *     <Timeline
 *       tasks={tasks}
 *       dependencies={dependencies}
 *       onTaskMove={handleTaskMove}
 *       onCreateDependency={handleCreateDependency}
 *       onTaskUpdate={fetchTasks}
 *       onTaskDelete={deleteTask}
 *     />
 *   );
 * }
 * ```
 * 
 * @example
 * Integration with context providers:
 * ```tsx
 * import { TimelineProvider } from './contexts/TimelineContext';
 * import { ThemeProvider } from './contexts/ThemeContext';
 * 
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <TimelineProvider>
 *         <Timeline {...timelineProps} />
 *       </TimelineProvider>
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
const VerticalTimeline: React.FC<VerticalTimelineProps> = ({
  tasks,
  dependencies,
  onTaskMove,
  onCreateDependency,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [selectedTask, setSelectedTask] = useState<TimelineTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Zoom handling hook
  const { zoom } = useZoom(containerRef);

  // Sync selectedTask with latest tasks when modal open
  useEffect(() => {
    if (showTaskModal && selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated && updated !== selectedTask) {
        setSelectedTask(updated);
      }
    }
  }, [tasks, showTaskModal, selectedTask]);

  // Constants with zoom scaling
  const rowHeight = BASE_ROW_HEIGHT * zoom;
  const taskNodeWidth = TASK_NODE_WIDTH * zoom;
  const taskNodeHeight = TASK_NODE_HEIGHT * zoom;

  // Core timeline logic hook
  const {
    dateRows,
    containerWidth,
    setContainerWidth,
    isCommandHeld,
    getTaskCoordinates,
  } = useTimeline(tasks, containerRef, rowHeight, () => {});

  // Calculate total height
  const totalHeight = dateRows.length * rowHeight;

  // Drag and drop handling hook
  const {
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
  } = useDrag(
    containerRef,
    rowHeight,
    dateRows,
    onTaskMove,
    onCreateDependency,
    setSelectedTask,
    setShowTaskModal
  );

  // Minimap handling hook
  const {
    minimapViewport,
    taskDots,
    setScrollTop: setMinimapScrollTop,
    handleMinimapMouseDown,
    handleMinimapMouseMove,
    handleMinimapMouseUp,
  } = useMinimap(containerRef, minimapRef, totalHeight, dateRows, rowHeight, setContainerWidth);
  
  // Auto-clear error messages after 5 seconds
  const [localDependencyError, setLocalDependencyError] = useState<string | null>(null);
  useEffect(() => {
    setLocalDependencyError(dependencyError);
    if (dependencyError) {
      const timer = setTimeout(() => {
        setLocalDependencyError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dependencyError]);

  // Event handlers
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Update minimap viewport when timeline is scrolled
    setMinimapScrollTop(e.currentTarget.scrollTop);
  };

  const handleTimelineClick = () => {
    if (connectingFrom) {
      setConnectingFrom(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Context menu handling is delegated to individual task components
  };

  const handleTaskContextMenu = async (e: React.MouseEvent, task: TimelineTask) => {
    e.preventDefault();
    
    if (connectingFrom === null) {
      setConnectingFrom(task.id);
      setDependencyError(null); // Clear any previous errors
    } else if (connectingFrom !== task.id) {
      try {
        const result = await onCreateDependency(connectingFrom, task.id);
        if (result.success) {
          setConnectingFrom(null);
          setDependencyError(null);
        } else {
          setDependencyError(result.error || "Failed to create dependency");
        }
      } catch (error) {
        setDependencyError(error instanceof Error ? error.message : "Error creating dependency");
      }
      setConnectingFrom(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#FFFFF8] dark:bg-gray-900 transition-colors duration-200">
      <MinimapContainer
        minimapRef={minimapRef}
        minimapViewport={minimapViewport}
        taskDots={taskDots}
        handleMinimapMouseDown={handleMinimapMouseDown}
        handleMinimapMouseMove={handleMinimapMouseMove}
        handleMinimapMouseUp={handleMinimapMouseUp}
      />
      <TimelineContainer
        containerRef={containerRef}
        dateRows={dateRows}
        totalHeight={totalHeight}
        rowHeight={rowHeight}
        taskNodeWidth={taskNodeWidth}
        taskNodeHeight={taskNodeHeight}
        draggedTask={draggedTask}
        draggedTaskPos={draggedTaskPos}
        dropTargetRowIndex={dropTargetRowIndex}
        connectingFrom={connectingFrom}
        isCommandHeld={isCommandHeld}
        taskRefs={taskRefs}
        handleTaskMouseDown={handleTaskMouseDown}
        handleTaskContextMenu={handleTaskContextMenu}
        getTaskCoordinates={getTaskCoordinates}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleTimelineClick={handleTimelineClick}
        handleContextMenu={handleContextMenu}
        handleScroll={handleScroll}
      >
        <DependencyLayer
          tasks={tasks}
          dependencies={dependencies}
          getTaskCoordinates={getTaskCoordinates}
          containerWidth={containerWidth}
          totalHeight={totalHeight}
          zoom={zoom}
        />
      </TimelineContainer>

      {/* Instructions and Error Messages */}
      {localDependencyError ? (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded px-4 py-2 text-sm text-red-800 dark:text-red-200">
          {localDependencyError}
        </div>
      ) : connectingFrom ? (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600 rounded px-4 py-2 text-sm text-orange-800 dark:text-orange-200">
          Right-click another task to create dependency
        </div>
      ) : null}
      
      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onTaskUpdate={onTaskUpdate}
          onTaskDelete={onTaskDelete}
          onDependencyUpdate={onTaskUpdate}
        />
      )}
    </div>
  );
};

export default VerticalTimeline;

