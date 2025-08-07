# PRD: Fix Dependency Arrow Connection Points

## Introduction/Overview

Currently, the dependency arrows in the timeline view are not connecting to the proper center points of task node edges. The arrows appear to connect at incorrect positions, creating a visually inconsistent and confusing user experience. This feature will fix the connection point calculations to ensure arrows properly connect to the center of the appropriate task edges, maintaining the existing bezier curve styling while adding collision avoidance capabilities.

## Goals

1. **Accurate Edge Connection**: Ensure dependency arrows connect precisely to the center of task node edges (top/bottom edges for vertical connections, left/right edges for horizontal connections)
2. **Visual Consistency**: Maintain a clean, professional appearance where all dependency arrows have consistent and predictable connection points
3. **Collision Avoidance**: Implement intelligent path routing to prevent arrows from overlapping with other tasks or UI elements
4. **Performance Optimization**: Ensure the connection calculations are efficient and don't impact timeline rendering performance
5. **Accessibility**: Improve visual clarity for users to better understand task dependencies

## User Stories

1. **As a project manager**, I want dependency arrows to connect cleanly to task edges so that I can easily follow the dependency flow between tasks.

2. **As a team member**, I want the timeline to look professional and polished so that I can confidently present it to stakeholders.

3. **As a visual user**, I want dependency arrows to avoid overlapping with other tasks so that I can clearly distinguish individual dependency relationships.

4. **As a user working with complex projects**, I want the dependency visualization to remain clear even when there are many interconnected tasks.

## Functional Requirements

### Core Connection Logic

1. **Edge Center Calculation**: The system must calculate the exact center point of task node edges for arrow connections.
   - For vertical connections (tasks in different rows): Connect to center of top/bottom edges
   - For horizontal connections (tasks in same row): Connect to center of left/right edges
   - Use the existing `TASK_NODE_WIDTH` (120px) and `TASK_NODE_HEIGHT` (40px) constants for calculations

2. **Direction-Based Connection**: The system must determine connection points based on the dependency direction.
   - If Task A depends on Task B, the arrow flows from B to A
   - Source connection point (Task B): Calculate appropriate edge center based on target position
   - Target connection point (Task A): Calculate appropriate edge center with arrow offset

3. **Zoom Compatibility**: Connection points must scale correctly with the current zoom level.
   - All calculations must use the zoom factor from the timeline context
   - Connection points must remain centered regardless of zoom level

### Bezier Curve Enhancement

4. **Maintain Current Curve Style**: Preserve the existing bezier curve implementation while fixing connection points.
   - Keep the current control point calculation logic in `DependencyLayer.tsx`
   - Maintain the existing `controlDistance` calculation for smooth curves

5. **Collision Avoidance**: Implement geometric path routing to avoid overlapping with other tasks.
   - **Bounding Box Detection**: Calculate intersections between bezier paths and task bounding boxes
   - **Control Point Adjustment**: When collisions are detected, offset control points to route around obstacles
   - **Minimum Clearance**: Maintain at least 10px clearance from task nodes when routing around them
   - **Waypoint Fallback**: For complex scenarios with multiple obstacles, implement simple L-shaped waypoint routing

6. **Connection Point Distribution**: For tasks with multiple dependencies, distribute connection points to prevent clustering.
   - **Anchor Spreading**: Evenly distribute connection points across available edge space
   - **Dynamic Offset**: Calculate connection point offsets based on the number of arrows per edge
   - **Direction-Based Logic**: Prioritize top/bottom edges for vertical flows, left/right for horizontal flows

7. **Interactive Enhancements**: Improve user experience during dependency visualization.
   - **Hover Highlighting**: Highlight active arrow and gray out others on hover
   - **Z-Index Management**: Bring hovered arrows to front for better visibility
   - **Arrow Staggering**: Implement vertical offset for arrows that would otherwise overlap

### Visual and Performance Requirements

8. **Consistent Visual Output**: All dependency arrows must have uniform appearance and behavior.
   - Maintain existing stroke colors and critical path highlighting
   - Preserve arrow markers and styling from `DependencyPath.tsx`

9. **Performance Optimization**: Connection calculations must be efficient for timelines with many dependencies.
   - Cache edge point calculations when task positions haven't changed
   - Optimize collision detection algorithms for large task sets
   - Ensure smooth rendering during zoom and pan operations

10. **Coordinate System Alignment**: Properly handle the existing coordinate system offsets.
    - Account for `MINIMAP_WIDTH` offset in SVG coordinate calculations
    - Ensure consistency between task positioning and arrow connection points

## Non-Goals (Out of Scope)

1. **Changing Arrow Visual Style**: This fix will not modify the existing bezier curve appearance, colors, or stroke widths
2. **New Dependency Creation UI**: This does not include changes to how users create or manage dependencies
3. **Task Node Redesign**: Task node appearance and sizing will remain unchanged
4. **Animation Effects**: No new animations or transitions for dependency arrows
5. **Mobile-Specific Optimizations**: Focus remains on desktop experience optimization

## Design Considerations

### Current Implementation Analysis
- The existing `getBoxEdgePointWithDirection` function in `utils/timeline/coordinates.ts` contains the core logic that needs improvement
- Current implementation uses a simple threshold (`Math.abs(dy) > 10`) to determine vertical vs horizontal connections
- Connection points are calculated but may not be hitting the exact edge centers

### Proposed Improvements
- **Enhanced Edge Detection**: Improve the logic in `getBoxEdgePointWithDirection` to more accurately determine which edge to connect to
- **Precise Center Calculation**: Ensure connection points are exactly at the center of the determined edge
- **Collision Detection Layer**: Add a new utility function to detect when paths intersect with task nodes and calculate alternative routes

## Technical Considerations

### Files to Modify
1. **`utils/timeline/coordinates.ts`**: Update `getBoxEdgePointWithDirection` function for accurate center calculations
2. **`app/components/Timeline/Dependencies/DependencyLayer.tsx`**: Add collision avoidance logic to path calculation
3. **Potential new file**: `utils/timeline/collisionAvoidance.ts` for complex routing algorithms

### Dependencies
- Existing timeline coordinate system and zoom functionality
- Current task positioning logic in `getTaskCoordinates`
- SVG rendering system in `DependencyLayer` and `DependencyPath` components

### Performance Considerations
- Collision detection should be optimized using spatial indexing if needed for large task sets
- Consider memoization for expensive geometric calculations
- Ensure calculations don't block the main thread during complex routing

## Success Metrics

1. **Visual Accuracy**: 100% of dependency arrows connect to the exact center of appropriate task edges
2. **Collision Avoidance**: 95% reduction in arrow-task overlaps in complex timeline scenarios
3. **Performance**: No measurable impact on timeline rendering performance (maintain <16ms frame times)
4. **User Experience**: Subjective improvement in timeline readability and professional appearance
5. **Code Quality**: Maintain or improve existing code test coverage

## Implementation Decisions

### 1. Collision Avoidance Algorithm
**Decision**: Custom geometric approach with optional waypoint fallback.

**Rationale**: A* pathfinding is overkill for this use case. A geometric approach provides:
- Fast runtime performance
- Fine visual control over curve appearance
- Minimal state management complexity

**Implementation Strategy**:
- Primary: Bezier curves with offset control points and bounding box avoidance
- Fallback: Simple waypoints for complex layouts (L-shaped routing around task clusters)
- Use geometric calculations to detect intersections with task bounding boxes
- Adjust control points to route around obstacles while maintaining smooth curves

### 2. Edge Case Handling (Task Proximity)
**Decision**: Prioritize visual clarity over perfect geometry.

**For close or overlapping tasks, implement**:
- **Vertical arrow staggering**: Fan connections to prevent overlap
- **Z-index management**: Bump hovered arrows to the front
- **Smart anchor spacing**: Distribute connection points to avoid clustering
- **Fallback anchoring**: In extreme cases, snap to consistent top/bottom anchor points
- **Optional enhancement**: "Collapse arrows" indicator (e.g., "+4 more") for high-density scenarios

### 3. Arrow Density Management
**Decision**: Distribute connection points around task bounding boxes.

**For high-dependency nodes**:
- Spread anchors evenly across top/bottom/left/right edges based on arrow direction
- Implement dynamic offset logic to prevent arrow overlap at connection points
- Use curved Bezier paths to handle directional turns gracefully
- **Interactive enhancement**: On hover, highlight relevant arrows and gray out others

### 4. Backward Compatibility
**Decision**: Implement migration-friendly anchor mapping.

**Compatibility audit requirements**:
- Check for hardcoded connection assumptions (e.g., center-to-center connections)
- Verify no legacy layout caching or persistence exists
- **If legacy dependencies exist**: Implement migration shim to map old connections to new anchor rules
- **Documentation**: Include visual layout change warnings in implementation notes
