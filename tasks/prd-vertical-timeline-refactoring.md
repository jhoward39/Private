# Product Requirements Document: VerticalTimeline Component Refactoring

## Introduction/Overview

The current `VerticalTimeline.tsx` component is a monolithic file containing 1,057 lines of code that handles timeline visualization, task management, drag-and-drop functionality, zooming, minimap navigation, and dependency management. This refactoring effort aims to break down this complex component into a well-organized, maintainable folder structure while preserving every aspect of the current functionality and visual appearance.

The goal is to improve code maintainability, readability, and developer experience without changing the external API or user-facing behavior.

## Goals

1. **Maintainability**: Break the monolithic component into smaller, focused modules that are easier to understand and modify
2. **Organization**: Create a logical folder structure organized by features (zoom, drag, minimap, dependencies)
3. **Reusability**: Extract reusable logic into custom hooks and utility functions
4. **Documentation**: Add comprehensive component documentation for better developer experience
5. **Preservation**: Maintain 100% of existing functionality, visual appearance, and external API compatibility
6. **Performance**: Ensure refactoring doesn't negatively impact component performance

## User Stories

1. **As a developer maintaining the timeline**, I want the code to be organized into logical, focused modules so that I can quickly find and modify specific functionality without navigating through a 1000+ line file.

2. **As a developer adding new features**, I want clear separation of concerns so that I can extend zoom functionality, drag behavior, or minimap features without affecting unrelated code.

3. **As a developer debugging issues**, I want well-documented components with clear interfaces so that I can understand data flow and component relationships.

4. **As a developer using the timeline component**, I want the external API to remain unchanged so that existing implementations continue to work without modification.

5. **As a developer reviewing code**, I want comprehensive documentation so that I can understand component architecture and make informed decisions about changes.

## Functional Requirements

### Core Refactoring Requirements

1. **Feature-Based Organization**: The component must be organized into feature-specific folders:
   - `Timeline/Zoom/` - Zoom functionality and related handlers
   - `Timeline/Drag/` - Drag and drop logic for tasks
   - `Timeline/Minimap/` - Minimap component and navigation
   - `Timeline/Dependencies/` - Dependency visualization and management
   - `Timeline/Core/` - Core timeline rendering and date calculations

2. **State Management**: Implement a combination approach:
   - Main Timeline component retains primary state coordination
   - Custom hooks for feature-specific state logic (useZoom, useDrag, etc.)
   - React Context for deeply shared state when appropriate

3. **Utility Extraction**: Extract all utility functions, constants, and helper methods:
   - `utils/timeline/constants.ts` - All timeline constants
   - `utils/timeline/dateUtils.ts` - Date parsing and formatting functions
   - `utils/timeline/coordinates.ts` - Coordinate calculation functions
   - `utils/timeline/geometry.ts` - Geometric calculations for dependencies

4. **Custom Hooks Creation**: Create feature-specific custom hooks:
   - `hooks/timeline/useZoom.ts` - Zoom state and handlers
   - `hooks/timeline/useDrag.ts` - Drag and drop logic
   - `hooks/timeline/useMinimap.ts` - Minimap functionality
   - `hooks/timeline/useTimeline.ts` - Core timeline logic

5. **Component Extraction**: Break down into focused components:
   - `Timeline/Core/TimelineContainer.tsx` - Main container
   - `Timeline/Core/DateRow.tsx` - Individual date row rendering
   - `Timeline/Core/TaskNode.tsx` - Individual task rendering
   - `Timeline/Minimap/MinimapContainer.tsx` - Minimap component
   - `Timeline/Dependencies/DependencyLayer.tsx` - SVG dependency arrows

### Folder Structure Requirements

6. **Directory Organization**: Create the following structure:
   ```
   components/Timeline/
   ├── Core/
   │   ├── TimelineContainer.tsx
   │   ├── DateRow.tsx
   │   └── TaskNode.tsx
   ├── Minimap/
   │   ├── MinimapContainer.tsx
   │   └── MinimapViewport.tsx
   ├── Dependencies/
   │   ├── DependencyLayer.tsx
   │   └── DependencyPath.tsx
   ├── Zoom/
   │   └── ZoomControls.tsx (if needed)
   └── index.tsx (main export)
   
   hooks/timeline/
   ├── useZoom.ts
   ├── useDrag.ts
   ├── useMinimap.ts
   ├── useTimeline.ts
   └── index.ts
   
   utils/timeline/
   ├── constants.ts
   ├── dateUtils.ts
   ├── coordinates.ts
   ├── geometry.ts
   └── index.ts
   ```

### API Compatibility Requirements

7. **External Interface**: The main `VerticalTimeline` component must maintain the exact same props interface:
   - `tasks: TimelineTask[]`
   - `dependencies: Dependency[]`
   - `onTaskMove: (taskId: number, newDate: string) => void`
   - `onCreateDependency: (fromId: number, toId: number) => Promise<{success: boolean, error?: string}>`
   - `onTaskUpdate: (task: TimelineTask) => void`
   - `onTaskDelete: (taskId: number) => void`

8. **Behavioral Preservation**: All existing behaviors must be preserved:
   - Zoom functionality with Ctrl/Cmd + scroll
   - Drag and drop task movement
   - Right-click dependency creation
   - Minimap navigation
   - Task modal opening with Cmd/Ctrl + click
   - Error message display and auto-clearing
   - Scroll-to-today functionality
   - Critical path visualization
   - Theme switching support

### Documentation Requirements

9. **Component Documentation**: Each new component must include:
   - JSDoc comments describing purpose and functionality
   - Props interface documentation with examples
   - Usage examples in component comments
   - Performance considerations where relevant

10. **Hook Documentation**: Each custom hook must include:
    - Purpose and use case documentation
    - Parameter and return value descriptions
    - Usage examples
    - Dependencies and side effects documentation

11. **Architecture Documentation**: Create comprehensive documentation:
    - Component relationship diagrams
    - Data flow documentation
    - State management patterns
    - Integration guide for new features

## Non-Goals (Out of Scope)

1. **Performance Optimization**: This refactoring focuses on organization, not performance improvements
2. **Feature Additions**: No new functionality will be added during refactoring
3. **Visual Changes**: No changes to styling, layout, or visual appearance
4. **API Enhancements**: No changes to the external component interface
5. **Technology Changes**: No migration to different state management libraries or major architectural changes
6. **Breaking Changes**: No modifications that would require updates to existing usage

## Design Considerations

### Component Architecture
- **Composition over Inheritance**: Use component composition to build complex functionality
- **Single Responsibility**: Each component should have one clear purpose
- **Props Interface**: Maintain clear, typed interfaces for all component props
- **Theme Integration**: Ensure all components properly integrate with the existing ThemeContext

### State Management Pattern
- **Centralized Coordination**: Main Timeline component orchestrates overall state
- **Feature Isolation**: Each feature hook manages its own related state
- **Minimal Context Usage**: Use React Context only for deeply nested shared state
- **Performance Awareness**: Prevent unnecessary re-renders through proper memoization

### File Organization
- **Feature Grouping**: Group related functionality together
- **Clear Naming**: Use descriptive, consistent naming conventions
- **Index Files**: Provide clean import/export interfaces
- **Type Definitions**: Maintain strong TypeScript typing throughout

## Technical Considerations

### Dependencies
- Must integrate with existing `ThemeContext` and `TimelineContext`
- Maintain compatibility with `TaskModal` component
- Preserve all existing prop types from `../../types`
- Continue using existing utility functions where appropriate

### Performance
- Ensure `useMemo` and `useCallback` optimizations are preserved
- Maintain efficient re-rendering patterns
- Preserve existing ref usage for DOM manipulation
- Keep SVG rendering optimizations intact

### Testing Compatibility
- New components should be compatible with existing test infrastructure
- Maintain testability through clear component boundaries
- Preserve existing test coverage through the refactoring

## Success Metrics

### Code Quality Metrics
1. **Maintainability**: Reduce average component size to under 200 lines
2. **Organization**: Achieve clear separation of concerns with no circular dependencies
3. **Documentation Coverage**: 100% of new components and hooks have comprehensive documentation
4. **Type Safety**: Maintain 100% TypeScript type coverage

### Functional Metrics
1. **API Compatibility**: 100% backward compatibility with existing usage
2. **Visual Fidelity**: Pixel-perfect preservation of current appearance
3. **Behavioral Consistency**: All existing interactions work identically
4. **Performance Parity**: No measurable performance degradation

### Developer Experience Metrics
1. **Discoverability**: Developers can find relevant code within 30 seconds
2. **Modification Speed**: Feature changes can be made without touching unrelated files
3. **Documentation Completeness**: New developers can understand component architecture from documentation alone

## Open Questions

1. **Context Usage**: Should we create a dedicated `TimelineContext` for internal state sharing, or rely on the existing `TimelineContext`?

2. **Hook Granularity**: Should we create more granular hooks (e.g., separate `useTaskDrag` and `useDependencyCreation`) or keep broader feature hooks?

3. **Component Boundaries**: Should the `TaskNode` component include its own drag logic, or should drag behavior remain at the container level?

4. **Utility Organization**: Should coordinate calculations be split into separate files by feature (drag coordinates, minimap coordinates, etc.) or kept together?

5. **Export Strategy**: Should we export individual components for advanced use cases, or only export the main `VerticalTimeline` component?

6. **Migration Strategy**: Should we implement the refactoring incrementally with feature flags, or as a complete replacement?

---

**Document Version**: 1.0  
**Created**: January 2025  
**Target Audience**: Junior to Senior Frontend Developers  
**Estimated Complexity**: High (Large-scale refactoring with strict compatibility requirements)
