import OpenAI from "openai";
import type { Operation, OperationType } from "@/types/ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PreviewParams {
  timelineContext?: unknown;
  projectId?: string;
}

/**
 * Calls the OpenAI Chat Completion endpoint with a constrained system prompt
 * instructing the model to return a JSON array of operations. The function
 * parses and lightly validates the response, throwing if the model returns
 * invalid JSON or disallowed operation types.
 */
export async function getPreviewOperations(
  prompt: string,
  { timelineContext, projectId }: PreviewParams = {}
): Promise<Operation[]> {
  // Build system prompt that explains the expected JSON schema
  const systemPrompt = `You are an assistant that converts natural-language instructions into a JSON array of operation objects for a project-management timeline.
Each operation **must** follow this exact TypeScript shape (no extra fields):

interface Operation {
  id: string; // uuid-v4
  type: "ADD_TASK" | "DELETE_TASK" | "ADD_DEPENDENCY" | "DELETE_DEPENDENCY";
  payload: Record<string, unknown>; // depends on type
}

When the user includes multiple task instructions (e.g., separated by "and" or listed on separate lines), output SEPARATE operation objects for each. Use the next logical occurrence of a day number if only the day-of-month is provided.

Example JSON (conforms exactly):
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "ADD_TASK",
    "payload": { "title": "Prepare slides", "dueDate": "2023-08-15", "duration": 2 }
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440111",
    "type": "ADD_DEPENDENCY",
    "payload": { "fromId": 12, "toId": 3 }
  }
]

Rules:
1. Only the four operation types above are allowed – no UPDATE operations.
2. Required payload keys per type:
   • ADD_TASK → 'title', 'dueDate', 'duration' (no synonyms).
   • DELETE_TASK → 'taskId'.
   • ADD_DEPENDENCY → prefer numeric 'fromId' / 'toId' that match the task IDs listed above. If IDs are unknown, you may use { 'fromTitle', 'fromDate', 'toTitle', 'toDate' } as fallback.
   • DELETE_DEPENDENCY → 'fromId', 'toId'.
3. Do NOT use synonyms such as 'task', 'name', 'date', or 'days' – always use exact keys above.
4. If the user prompt is ambiguous, omit the unclear parts rather than guessing.
5. Return **only** a JSON array (no markdown, no code fences).
6. Do not include comments or trailing commas.
`;

  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  const userPrompt = [
    `Today is ${todayISO}.`,
    "\nUser prompt:\n" + prompt,
    projectId ? `\nProject ID: ${projectId}` : "",
    timelineContext && Array.isArray(timelineContext)
      ? "\nExisting tasks (id | title | dueDate):\n" +
        timelineContext
          .map((t: any) => `${t.id} | ${t.title} | ${t.dueDate}`)
          .join("\n")
      : "",
  ].join("");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Cheapest GPT-4 variant; adjust as needed
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  console.log("LLM raw content", content);
  if (!content) throw new Error("OpenAI returned empty response");

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse OpenAI response:", content);
    throw new Error("OpenAI did not return valid JSON");
  }

  if (!Array.isArray(parsed)) {
    // Some models may wrap result in { operations: [...] }
    if (typeof parsed === "object" && parsed !== null && Array.isArray((parsed as any).operations)) {
      console.log("Wrapped operations array detected, unwrapping …");
      parsed = (parsed as any).operations;
    } else if (typeof parsed === "object" && parsed !== null) {
      // Single-object case
      parsed = [parsed] as any[];
    } else {
      throw new Error("OpenAI response is not an array");
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("Parsed array length", parsed.length, parsed);
  }

  // Basic validation of each operation
  const allowedTypes = new Set<OperationType>([
    "ADD_TASK",
    "DELETE_TASK",
    "ADD_DEPENDENCY",
    "DELETE_DEPENDENCY",
  ]);

  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const synonymMap: Record<string, string> = {
    task: "title",
    name: "title",
    date: "dueDate",
    days: "duration",
  };

  function normalizePayload(type: OperationType, payload: Record<string, unknown>): Record<string, unknown> {
    const normalised: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(payload)) {
      const wantedKey = synonymMap[key] ?? key;
      normalised[wantedKey] = val;
    }
    return normalised;
  }

  const operations: Operation[] = [];
  (parsed as any[]).forEach((raw: any, idx: number) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("RAW candidate", idx, raw);
    }
  });

  for (const raw of parsed) {
    if (
      typeof raw !== "object" ||
      raw === null ||
      !allowedTypes.has(raw.type) ||
      typeof raw.payload !== "object" ||
      raw.payload === null
    ) {
      // Skip invalid entries
      continue;
    }

    // Ensure valid ID (uuid-v4); if invalid, generate one
    let idStr: string;
    if (typeof raw.id === "string" && uuidV4Regex.test(raw.id)) {
      idStr = raw.id;
    } else {
      // Node >=16.14 has crypto.randomUUID
      try {
        idStr = (await import("crypto")).randomUUID();
      } catch {
        idStr = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      }
    }

    const normPayload = normalizePayload(raw.type, raw.payload);

    const op: Operation = {
      id: idStr,
      type: raw.type,
      payload: normPayload,
    };
    operations.push(op);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("Normalised ops", operations);
  }
  return operations;
}

