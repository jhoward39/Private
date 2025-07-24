import { NextResponse } from 'next/server';
import { 
  buildDependencyGraph,
  hasCircularDependency,
  topologicalSort,
  calculateCriticalPath,
  addDependency,
  getAllDependencies
} from '@/lib/dependencies';

export async function GET() {
  try {
    // Test the dependency system
    console.log('Testing dependency system...');
    
    const graph = await buildDependencyGraph();
    console.log('Graph built successfully with', graph.nodes.size, 'nodes');
    
    if (graph.nodes.size > 0) {
      const sorted = topologicalSort(graph);
      console.log('Top 