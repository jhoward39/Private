import React from "react";
import type { Operation } from "@/types/ai";

interface Props {
  operations: (Operation & { status: "success" | "failed"; message?: string })[];
  onAccept: (op: Operation) => void;
  onReject: (op: Operation) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose: () => void;
}

const statusIcon = (status: "success" | "failed") => {
  return status === "success" ? (
    <span className="text-green-600">✓</span>
  ) : (
    <span className="text-red-600">✗</span>
  );
};

export const OperationDiffPanel: React.FC<Props> = ({
  operations,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  onClose,
}) => {
  if (!operations || operations.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50">
      <div className="bg-[#FFFFF8] dark:bg-gray-900 w-full max-w-lg rounded-t-lg shadow-xl p-4 border border-gray-300 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">AI Suggested Operations</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
        </div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {operations.map((op) => (
            <div
              key={op.id}
              className="border border-gray-300 dark:border-gray-600 rounded p-3 flex justify-between items-center gap-4 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center gap-2 text-sm">
                {statusIcon(op.status)}
                <span className="font-mono text-xs">{op.type}</span>
                {op.type === "ADD_TASK" && (
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {(op.payload as any).title} — {(op.payload as any).dueDate}
                  </span>
                )}
                {op.type === "DELETE_TASK" && (
                  <span className="text-xs text-gray-700 dark:text-gray-300"># {(op.payload as any).taskId}</span>
                )}
                {op.type === "ADD_DEPENDENCY" && (
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {(op.payload as any).fromId} ➜ {(op.payload as any).toId}
                  </span>
                )}
                {op.type === "DELETE_DEPENDENCY" && (
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {(op.payload as any).fromId} ✕ {(op.payload as any).toId}
                  </span>
                )}
                {op.status === "failed" && <span className="text-red-500 text-xs">{op.message}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 text-xs border border-green-600 text-green-600 rounded hover:bg-green-600 hover:text-white disabled:opacity-50"
                  onClick={() => onAccept(op)}
                  disabled={op.status === "failed"}
                >
                  ✓
                </button>
                <button
                  className="px-2 py-1 text-xs border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white"
                  onClick={() => onReject(op)}
                >
                  ✗
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onRejectAll}
            className="px-3 py-1 border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white text-sm"
          >
            Reject All
          </button>
          <button
            onClick={onAcceptAll}
            className="px-3 py-1 border border-green-600 text-green-600 rounded hover:bg-green-600 hover:text-white text-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

