import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Operation } from "@/types/ai";

/**
 * PATCH  – "accept" an operation (commit it)
 * DELETE – "reject" an operation (undo draft)
 *
 * Request body must include the full Operation object so the server knows what to commit/revert.
 */
export async function PATCH(request: Request, { params }: { params: { operationId: string } }) {
  return handleOperation(request, params.operationId, "accept");
}

export async function DELETE(request: Request, { params }: { params: { operationId: string } }) {
  return handleOperation(request, params.operationId, "reject");
}

async function handleOperation(req: Request, opId: string, action: "accept" | "reject") {
  try {
    const { operation } = (await req.json()) as { operation: Operation };
    if (!operation || operation.id !== opId) {
      return NextResponse.json({ error: "operation mismatch" }, { status: 400 });
    }

    const { type, payload } = operation;

    await prisma.$transaction(async (tx) => {
      switch (type) {
        case "ADD_TASK": {
          const { taskId } = payload as { taskId: number };
          if (!taskId) throw new Error("payload.taskId missing");
          if (action === "accept") {
            await tx.todo.update({ where: { id: taskId }, data: { isDraft: false } });
          } else {
            await tx.todo.delete({ where: { id: taskId } });
          }
          break;
        }
        case "DELETE_TASK": {
          const { taskId } = payload as { taskId: number };
          if (!taskId) throw new Error("payload.taskId missing");
          if (action === "accept") {
            await tx.todo.delete({ where: { id: taskId, isDraft: true } });
          } else {
            await tx.todo.update({ where: { id: taskId }, data: { isDraft: false } });
          }
          break;
        }
        case "ADD_DEPENDENCY": {
          const { fromId, toId } = payload as { fromId: number; toId: number };
          if (action === "accept") {
            await tx.taskDependency.update({
              where: { taskId_dependsOnId: { taskId: fromId, dependsOnId: toId } },
              data: { isDraft: false },
            });
          } else {
            await tx.taskDependency.delete({
              where: { taskId_dependsOnId: { taskId: fromId, dependsOnId: toId } },
            });
          }
          break;
        }
        case "DELETE_DEPENDENCY": {
          const { fromId, toId } = payload as { fromId: number; toId: number };
          if (action === "accept") {
            await tx.taskDependency.delete({
              where: { taskId_dependsOnId: { taskId: fromId, dependsOnId: toId } },
            });
          } else {
            await tx.taskDependency.update({
              where: { taskId_dependsOnId: { taskId: fromId, dependsOnId: toId } },
              data: { isDraft: false },
            });
          }
          break;
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Operation commit/reject error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

