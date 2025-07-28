import { prisma } from "./prisma";

export interface TaskNode {
  id: number;
  title: string;
  duration: number;
  dueDate?: Date;
  dependencies: number[];
  dependentTasks: number[];
  earliestStartDate?: Date;
  isOnCriticalPath: boolean;
}

export interface DependencyGraph {
  nodes: Map<number, TaskNode>;
  adjacencyList: Map<number, number[]>;
}

/**
 * Build dependency graph from database
 */
export async function buildDependencyGraph(): Promise<DependencyGraph> {
  const todos = await prisma.todo.findMany({
    include: {
      dependencies: true,
      dependentTasks: true,
    },
  });

  const nodes = new Map<number, TaskNode>();
  const adjacencyList = new Map<number, number[]>();

  // Build nodes
  for (const todo of todos) {
    const dependencies = todo.dependencies.map((dep: { dependsOnId: number }) => dep.dependsOnId);
    const dependentTasks = todo.dependentTasks.map((dep: { taskId: number }) => dep.taskId);

    nodes.set(todo.id, {
      id: todo.id,
      title: todo.title,
      duration: todo.duration,
      dueDate: todo.dueDate || undefined,
      dependencies,
      dependentTasks,
      earliestStartDate: todo.earliestStartDate || undefined,
      isOnCriticalPath: todo.isOnCriticalPath,
    });

    adjacencyList.set(todo.id, dependencies);
  }

  return { nodes, adjacencyList };
}

/**
 * Detect circular dependencies using DFS with recursion stack
 */
export function hasCircularDependency(
  graph: DependencyGraph,
  newTaskId: number,
  newDependencyId: number,
): boolean {
  // Create a temporary graph with the new dependency
  const tempAdjacencyList = new Map(graph.adjacencyList);
  const currentDeps = tempAdjacencyList.get(newTaskId) || [];
  tempAdjacencyList.set(newTaskId, [...currentDeps, newDependencyId]);

  const visited = new Set<number>();
  const recursionStack = new Set<number>();

  function dfs(nodeId: number): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // Cycle detected
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const dependencies = tempAdjacencyList.get(nodeId) || [];
    for (const depId of dependencies) {
      if (dfs(depId)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check from all nodes to ensure we catch all cycles
  for (const nodeId of Array.from(graph.nodes.keys())) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Topological sort using Kahn's algorithm
 */
export function topologicalSort(graph: DependencyGraph): number[] {
  const inDegree = new Map<number, number>();
  const result: number[] = [];
  const queue: number[] = [];

  // Initialize in-degrees
  for (const nodeId of Array.from(graph.nodes.keys())) {
    inDegree.set(nodeId, 0);
  }

  // Calculate in-degrees (each task's in-degree = number of tasks it depends on)
  for (const [taskId, dependencies] of Array.from(graph.adjacencyList.entries())) {
    inDegree.set(taskId, dependencies.length);
  }

  // Find all nodes with no incoming edges
  for (const [nodeId, degree] of Array.from(inDegree.entries())) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  // Process queue
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    result.push(currentId);

    // Find all tasks that depend on the current task (successors)
    for (const [taskId, dependencies] of Array.from(graph.adjacencyList.entries())) {
      if (dependencies.includes(currentId)) {
        const newInDegree = (inDegree.get(taskId) || 0) - 1;
        inDegree.set(taskId, newInDegree);

        if (newInDegree === 0) {
          queue.push(taskId);
        }
      }
    }
  }

  return result;
}

/**
 * Calculate Critical Path Method (CPM) - Forward and Backward Pass
 */
export function calculateCriticalPath(graph: DependencyGraph): {
  criticalPath: number[];
  earliestTimes: Map<number, number>;
  latestTimes: Map<number, number>;
  criticalPathSet: Set<number>;
} {
  const sortedNodes = topologicalSort(graph);
  const earliestTimes = new Map<number, number>();
  const latestTimes = new Map<number, number>();
  const earliestFinish = new Map<number, number>();

  // Initialize all earliest start times to 0
  for (const nodeId of Array.from(graph.nodes.keys())) {
    earliestTimes.set(nodeId, 0);
  }

  // FORWARD PASS - calculate earliest start/finish times
  for (const nodeId of sortedNodes) {
    const node = graph.nodes.get(nodeId)!;
    let earliestStart = earliestTimes.get(nodeId) || 0;

    // Check all dependencies and find the latest finish time
    const dependencies = graph.adjacencyList.get(nodeId) || [];
    for (const depId of dependencies) {
      const depFinish = earliestFinish.get(depId) || 0;
      earliestStart = Math.max(earliestStart, depFinish);
    }

    earliestTimes.set(nodeId, earliestStart);
    const finishTime = earliestStart + node.duration;
    earliestFinish.set(nodeId, finishTime);
  }

  // Find project completion time (max earliest finish time)
  const projectDuration = Math.max(...Array.from(earliestFinish.values()));

  // BACKWARD PASS - calculate latest finish/start times
  const latestFinish = new Map<number, number>();
  
  // Initialize all latest finish times to project duration
  for (const nodeId of Array.from(graph.nodes.keys())) {
    latestFinish.set(nodeId, projectDuration);
  }

  // Process nodes in reverse topological order
  for (const nodeId of [...sortedNodes].reverse()) {
    const node = graph.nodes.get(nodeId)!;
    
    // Find tasks that depend on this task (successors)
    const successors: number[] = [];
    for (const [taskId, deps] of Array.from(graph.adjacencyList.entries())) {
      if (deps.includes(nodeId)) {
        successors.push(taskId);
      }
    }

    // If this task has successors, its latest finish is constrained by them
    if (successors.length > 0) {
      let minSuccessorStart = Infinity;
      for (const successorId of successors) {
        const successorLatestStart = latestTimes.get(successorId);
        if (successorLatestStart !== undefined) {
          minSuccessorStart = Math.min(minSuccessorStart, successorLatestStart);
        }
      }
      if (minSuccessorStart !== Infinity) {
        latestFinish.set(nodeId, minSuccessorStart);
      }
    }

    const latestStart = latestFinish.get(nodeId)! - node.duration;
    latestTimes.set(nodeId, latestStart);
  }

  // IDENTIFY CRITICAL TASKS - where earliest start = latest start (zero slack)
  const criticalPath: number[] = [];
  const criticalPathSet = new Set<number>(); // Use Set to avoid type issues
  
  for (const nodeId of Array.from(graph.nodes.keys())) {
    const earliest = earliestTimes.get(nodeId) || 0;
    const latest = latestTimes.get(nodeId) || 0;
    const slack = Math.abs(latest - earliest);

    if (slack < 0.001) {
      // Account for floating point precision
      criticalPath.push(nodeId);
      criticalPathSet.add(nodeId);
    }
  }
  
  return { criticalPath, earliestTimes, latestTimes, criticalPathSet };
}

/**
 * Update task scheduling in database
 */
export async function updateTaskScheduling(): Promise<void> {
  const graph = await buildDependencyGraph();
  const { criticalPathSet, earliestTimes } = calculateCriticalPath(graph);

  // Use today as the project start date
  const projectStartDate = new Date();
  projectStartDate.setHours(0, 0, 0, 0); // Set to start of day

  // Use atomic transaction to update all tasks
  await prisma.$transaction(async (tx) => {
    for (const [taskId] of Array.from(graph.nodes.entries())) {
      const earliestStart = earliestTimes.get(taskId) || 0;
      const isOnCriticalPath = criticalPathSet.has(taskId); // Use Set.has() instead of Array.includes()

      // Calculate earliest start date from project start date
      const earliestStartDate = new Date(projectStartDate);
      earliestStartDate.setDate(projectStartDate.getDate() + earliestStart);

      await tx.todo.update({
        where: { id: taskId },
        data: {
          earliestStartDate,
          isOnCriticalPath,
        },
      });
    }
  });
}

/**
 * Add a dependency between tasks
 */
export async function addDependency(taskId: number, dependsOnId: number): Promise<boolean> {
  if (taskId === dependsOnId) {
    throw new Error("A task cannot depend on itself");
  }

  // Check for duplicate dependency
  const existing = await prisma.taskDependency.findUnique({
    where: {
      taskId_dependsOnId: {
        taskId,
        dependsOnId,
      },
    },
  });
  if (existing) {
    throw new Error("This dependency already exists");
  }

  // Check for circular dependencies
  const graph = await buildDependencyGraph();
  if (hasCircularDependency(graph, taskId, dependsOnId)) {
    throw new Error("Adding this dependency would create a circular dependency");
  }

  // Add the dependency
  await prisma.taskDependency.create({
    data: {
      taskId,
      dependsOnId,
    },
  });

  // Update scheduling
  await updateTaskScheduling();

  return true;
}

/**
 * Remove a dependency between tasks
 */
export async function removeDependency(taskId: number, dependsOnId: number): Promise<void> {
  await prisma.taskDependency.deleteMany({
    where: {
      taskId,
      dependsOnId,
    },
  });

  // Update scheduling
  await updateTaskScheduling();
}

/**
 * Get all dependencies with task information
 */
export async function getAllDependencies() {
  return await prisma.taskDependency.findMany({
    include: {
      task: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          duration: true,
          isOnCriticalPath: true,
          earliestStartDate: true,
        },
      },
      dependsOn: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          duration: true,
          isOnCriticalPath: true,
          earliestStartDate: true,
        },
      },
    },
  });
}

/**
 * Get critical path information
 */
export async function getCriticalPathInfo() {
  const graph = await buildDependencyGraph();
  const { criticalPath, earliestTimes, latestTimes } = calculateCriticalPath(graph);

  const criticalPathTasks = criticalPath.map((taskId) => {
    const node = graph.nodes.get(taskId)!;
    return {
      id: taskId,
      title: node.title,
      duration: node.duration,
      earliestStart: earliestTimes.get(taskId) || 0,
      latestStart: latestTimes.get(taskId) || 0,
      slack: (latestTimes.get(taskId) || 0) - (earliestTimes.get(taskId) || 0),
    };
  });

  return {
    criticalPath: criticalPathTasks,
    totalDuration: Math.max(
      ...Array.from(earliestTimes.values()).map((start, idx) => {
        const taskId = Array.from(graph.nodes.keys())[idx];
        const node = graph.nodes.get(taskId)!;
        return start + node.duration;
      }),
    ),
  };
}

