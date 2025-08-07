import React from "react";

/**
 * Represents a single dot on the minimap, corresponding to a date row with tasks.
 */
interface TaskDot {
  /** The vertical position of the dot. */
  top: number;
  /** The number of tasks on that date, used to determine dot size. */
  count: number;
}

/**
 * Props for the TaskDots component.
 */
interface TaskDotsProps {
  /** An array of task dot data to be rendered. */
  dots: TaskDot[];
}

/**
 * Renders the small dots on the minimap that represent days with tasks.
 * The size of the dot is proportional to the number of tasks on that day.
 *
 * @param {TaskDotsProps} props The props for the component.
 * @returns {JSX.Element} The rendered task dots.
 */
const TaskDots: React.FC<TaskDotsProps> = ({ dots }) => {
  return (
    <>
      {dots.map((dot, index) => (
        <div
          key={index}
          className="absolute left-1/2 transform -translate-x-1/2 bg-blue-600 rounded-full"
          style={{
            width: Math.min(12, 6 + Math.floor(dot.count * 1.5)),
            height: Math.min(12, 6 + Math.floor(dot.count * 1.5)),
            top: dot.top - Math.min(6, 3 + Math.floor(dot.count * 0.75)),
          }}
          title={`${dot.count} task${dot.count > 1 ? "s" : ""}`}
        />
      ))}
    </>
  );
};

export default TaskDots;

