import { NextResponse } from "next/server";
// @ts-ignore - path alias
import { getPreviewOperations } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { buildDependencyGraph, hasCircularDependency } from "@/lib/dependencies";
import type { Operation, PreviewResponse } from "@/types/ai";


export async function POST(request: Request) {
  try {
    const { prompt, timelineContext, projectId } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "`prompt` is required" }, { status: 400 });
    }

    // Call OpenAI helper (implementation to be provided in lib/openai.ts)
    const operations: Operation[] = await getPreviewOperations(prompt, {
      timelineContext,
      projectId,
    });

    // Apply DELETE operations first, then ADD operations, all within a single transaction
    const operationsWithStatus: (Operation & { status: "success" | "failed"; message?: string })[] = [];

    await prisma.$transaction(async (tx) => {
      // Helper functions
      const markFailed = (op: Operation, msg: string) => {
        operationsWithStatus.push({ ...op, status: "failed", message: msg });
      };
      const markSuccess = (op: Operation) => {
        operationsWithStatus.push({ ...op, status: "success" });
      };

      // 1) DELETE_TASK / DELETE_DEPENDENCY
      for (const op of operations.filter((o) => o.type.startsWith("DELETE"))) {
        try {
          if (op.type === "DELETE_TASK") {
            const { taskId } = op.payload as { taskId: number };
            if (!taskId) throw new Error("payload.taskId missing");
            // @ts-ignore
          await tx.todo.update({ where: { id: taskId }, data: { isDraft: true } });
          } else if (op.type === "DELETE_DEPENDENCY") {
            const { fromId, toId } = op.payload as { fromId: number; toId: number };
            if (!fromId || !toId) throw new Error("payload.fromId / toId missing");
            // @ts-ignore
            // @ts-ignore
            await tx.taskDependency.update({
              where: { taskId_dependsOnId: { taskId: fromId, dependsOnId: toId } },
              // @ts-ignore
              data: { isDraft: true },
            });
          }
          markSuccess(op);
        } catch (err: any) {
          markFailed(op, err.message);
        }
      }

      // 2) ADD_TASK first
      const taskIdMap = new Map<string, number>();
      for (const op of operations.filter((o) => o.type === "ADD_TASK")) {
        try {
          const { title, dueDate, duration = 1 } = op.payload as {
            title: string;
            dueDate?: string;
            duration?: number;
          };
          if (!title) throw new Error("payload.title missing");

          // Duplicate check
          const existing = await tx.todo.findFirst({
            where: {
              title,
              dueDate: dueDate ? new Date(dueDate) : undefined,
            },
          });
          if (existing) {
            // Store existing ID so dependencies can reference it
            taskIdMap.set(title + (dueDate ?? ""), existing.id);
            markFailed(op, "duplicate task");
            continue;
          }

          // @ts-ignore
          // @ts-ignore
          // @ts-ignore
          // @ts-ignore
          const newTask = await tx.todo.create({
            // @ts-ignore
                          data: {
                title,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                duration: duration as number,
                // @ts-ignore
                isDraft: true,
              } as any,
          });

          op.payload = { ...op.payload, taskId: newTask.id } as any;
          op.id = String(newTask.id);
          taskIdMap.set(title + (dueDate ?? ""), newTask.id);
          markSuccess(op);
        } catch (err: any) {
          markFailed(op, err.message);
        }
      }

      // 3) ADD_DEPENDENCY after tasks exist
      for (const op of operations.filter((o) => o.type === "ADD_DEPENDENCY")) {
        try {
          let { fromId, toId, fromTitle, toTitle, fromDate, toDate } = op.payload as any;

          // Resolve via newly created tasks map
          if (!fromId && fromTitle) {
            const key = fromTitle + (fromDate ?? "");
            fromId = taskIdMap.get(key);
          }
          if (!toId && toTitle) {
            const key = toTitle + (toDate ?? "");
            toId = taskIdMap.get(key);
          }

          // Fallback: lookup existing tasks in DB by title/date
          if (!fromId && fromTitle) {
            const existing = await tx.todo.findFirst({
              where: {
                title: fromTitle,
                dueDate: fromDate ? new Date(fromDate) : undefined,
              },
            });
            if (existing) fromId = existing.id;
          }
          if (!toId && toTitle) {
            const existing = await tx.todo.findFirst({
              where: {
                title: toTitle,
                dueDate: toDate ? new Date(toDate) : undefined,
              },
            });
            if (existing) toId = existing.id;
          }

          if (!fromId || !toId) throw new Error("fromId/toId missing");

          const graph = await buildDependencyGraph(true);
          if (hasCircularDependency(graph, fromId, toId)) {
            throw new Error("Adding this dependency would create a circular dependency");
          }
          // @ts-ignore
          // @ts-ignore
          // @ts-ignore
          // @ts-ignore
          // @ts-ignore
          await tx.taskDependency.create({
                          data: { taskId: fromId, dependsOnId: toId, /* @ts-ignore */ isDraft: true } as any,
          });
          markSuccess(op);
        } catch (err: any) {
          markFailed(op, err.message);
        }
      }

    });

    if (process.env.NODE_ENV !== "production") {
      console.log("Server ops", operationsWithStatus);
    }

    const response: PreviewResponse = {
      operations: operationsWithStatus,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error generating bulk preview:", error);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}

