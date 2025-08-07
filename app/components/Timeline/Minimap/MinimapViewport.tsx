import React from "react";

/**
 * Props for the MinimapViewport component.
 */
interface MinimapViewportProps {
  /** The calculated top position of the viewport indicator. */
  top: number;
  /** The calculated height of the viewport indicator. */
  height: number;
}

/**
 * Renders the draggable viewport indicator within the minimap.
 *
 * @param {MinimapViewportProps} props The props for the component.
 * @returns {JSX.Element} The rendered minimap viewport indicator.
 */
const MinimapViewport: React.FC<MinimapViewportProps> = ({ top, height }) => {
  return (
    <div
      className="absolute left-0 right-0 bg-gray-300 border border-gray-400 rounded-sm opacity-80"
      style={{
        top: top,
        height: height,
      }}
    >
      <div className="w-full h-full bg-gray-200"></div>
    </div>
  );
};

export default MinimapViewport;

