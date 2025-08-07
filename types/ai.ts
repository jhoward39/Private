// Shared types for AI bulk operations preview

export type OperationType =
  | "ADD_TASK"
  | "DELETE_TASK"
  | "ADD_DEPENDENCY"
  | "DELETE_DEPENDENCY";

// Inbound operations coming from LLM may miss the `id`
export interface InboundOperation {
  id?: string;
  type: OperationType;
  payload: Record<string, unknown>;
}

export interface Operation {
  id: string; // authoritative UUID or DB id
  type: OperationType;
  payload: Record<string, unknown>;
}

export interface PreviewResponse {
  operations: Operation[];
  timeline?: unknown; // Placeholder – will include draft graph later
}

