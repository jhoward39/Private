## Relevant Files

- `utils/timeline/coordinates.ts` - Contains `getBoxEdgePointWithDirection` function that needs improvement for accurate edge center calculations
- `utils/timeline/coordinates.test.ts` - Unit tests for coordinate calculation functions
- `app/components/Timeline/Dependencies/DependencyLayer.tsx` - Main component that calculates dependency paths and renders SVG arrows
- `app/components/Timeline/Dependencies/DependencyLayer.test.tsx` - Unit tests for dependency layer component
- `utils/timeline/geometry.ts` - Already contains collision detection utilities that can be extended
- `utils/timeline/geometry.test.ts` - Unit tests for geometric utility functions
- `utils/timeline/collisionAvoidance.ts` - New utility file for advanced collision avoidance algorithms
- `utils/timeline/collisionAvoidance.test.ts` - Unit tests for collision avoidance utilities
- `app/components/Timeline/Dependencies/DependencyPath.tsx` - Individual arrow component that may need hover interaction enhancements
- `app/components/Timeline/Dependencies/DependencyPath.test.tsx` - Unit tests for individual dependency path component

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Fix Core Edge Connection Point Calculations
  - [x] 1.1 Fix `getBoxEdgePointWithDirection` function in `utils/timeline/coordinates.ts` to calculate exact center points of task edges
  - [x] 1.2 Replace the `Math.abs(dy) > 10` threshold with proper geometric edge detection
  - [x] 1.3 Ensure connection points account for zoom scaling and `MINIMAP_WIDTH` offset

- [ ] 2.0 Basic Collision Avoidance
  - [ ] 2.1 Add simple control point offset logic to `DependencyLayer.tsx` to route around task bounding boxes
  - [ ] 2.2 Implement minimum 10px clearance from task nodes when adjusting bezier control points
