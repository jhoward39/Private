import { updateTaskScheduling, buildDependencyGraph, calculateCriticalPath } from './lib/dependencies.ts';

async function testCriticalPath() {
  try {
    console.log('=== TESTING CRITICAL PATH CALCULATION ===');
    
    // Build the graph
    const graph = await buildDependencyGraph();
    console.log('Graph nodes:', Array.from(graph.nodes.keys()));
    
    // Calculate critical path
    const { criticalPath, earliestTimes, latestTimes } = calculateCriticalPath(graph);
    
    console.log('\n=== MANUAL TEST RESULTS ===');
    console.log('Critical path:', criticalPath);
    
    // Run the update
    console.log('\n=== RUNNING UPDATE ===');
    await updateTaskScheduling();
    
    console.log('Update completed successfully');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testCriticalPath(); 