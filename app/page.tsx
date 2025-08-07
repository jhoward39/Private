"use client";
import { useState, useEffect } from "react";
import VerticalTimeline from "./components/Timeline";
import CustomCalendar from "./components/CustomCalendar";
import TaskPieChart from "./components/TaskPieChart";
import ErrorBoundary from "./components/ErrorBoundary";
import { OperationDiffPanel } from "./components/OperationDiffPanel";
import { TimelineProvider, useTimeline } from "./contexts/TimelineContext";
import { CONFIG } from "../lib/config";

function HomeContent() {
  const { state, actions, derived } = useTimeline();

  // Add-task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDuration, setNewDuration] = useState(CONFIG.DEFAULT_TASK_DURATION.toString());
  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [previewOps, setPreviewOps] = useState<Array<any>>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    actions.fetchTodos();
    actions.fetchDependencyInfo();
    // ESLint disabled: Adding actions would cause infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling for image loading
  useEffect(() => {
    if (!state.hasPendingImages) return;
    const id = setInterval(actions.fetchTodos, CONFIG.POLLING_INTERVAL_MS);
    return () => clearInterval(id);
    // ESLint disabled: Adding actions.fetchTodos would cause infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hasPendingImages]);

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;

    try {
      await actions.createTodo(newTitle, newDueDate || null, parseInt(newDuration) || 1);

      // Reset form
      setNewTitle("");
      setNewDueDate("");
      setNewDuration(CONFIG.DEFAULT_TASK_DURATION.toString());
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleAiPrompt = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      const res = await fetch("/api/ai/bulk-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, timelineContext: derived.timelineTasks }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log("AI preview operations", data.operations);
        setPreviewOps(data.operations || []);
        setShowDiff(true);
        // Refresh tasks and dependencies so draft items appear
        actions.fetchTodos();
        actions.fetchDependencyInfo();
        setAiLoading(false);
      }
    } catch (error) {
      console.error("AI prompt failed:", error);
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFF8] dark:bg-gray-900 relative transition-colors duration-200">
      {/* Loading indicator */}
      {(state.loading || aiLoading) && (
        <div
          className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[${CONFIG.Z_INDEX.FLOATING_UI}]`}
        >
          <div className="bg-blue-500 text-white px-4 py-2 rounded-md">{aiLoading ? 'Processing AI…' : 'Loading...'}</div>
        </div>
      )}

      {/* Error indicator */}
      {state.error && (
        <div
          className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[${CONFIG.Z_INDEX.FLOATING_UI}]`}
        >
          <div className="bg-red-500 text-white px-4 py-2 rounded-md">{state.error}</div>
        </div>
      )}

      {/* Project overview pie chart */}
      {state.dependencyInfo && (
        <div className={`absolute top-4 right-4 z-[${CONFIG.Z_INDEX.UI_BAR}]`}>
          <TaskPieChart
            uncompletedTasks={derived.uncompletedTasks}
            overdueTasks={derived.overdueTasks}
          />
        </div>
      )}

      {/* Vertical Timeline */}
      <VerticalTimeline
        tasks={derived.timelineTasks}
        dependencies={derived.timelineDependencies}
        onTaskMove={actions.moveTodo}
        onCreateDependency={actions.createDependency}
        onTaskUpdate={actions.fetchTodos}
        onTaskDelete={actions.deleteTodo}
      />

      {/* Diff Overlay */}
      {showDiff && (
        <OperationDiffPanel
          operations={previewOps}
          onAccept={async (op) => {
            await fetch(`/api/ai/bulk-preview/${op.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ operation: op }),
            });
            setPreviewOps((prev) => prev.filter((o) => o.id !== op.id));
            actions.fetchTodos();
            actions.fetchDependencyInfo();
          }}
          onReject={async (op) => {
            await fetch(`/api/ai/bulk-preview/${op.id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ operation: op }),
            });
            setPreviewOps((prev) => prev.filter((o) => o.id !== op.id));
            actions.fetchTodos();
            actions.fetchDependencyInfo();
          }}
          onAcceptAll={async () => {
            await Promise.all(
              previewOps.map((op) =>
                fetch(`/api/ai/bulk-preview/${op.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ operation: op }),
                }),
              ),
            );
            setPreviewOps([]);
            actions.fetchTodos();
            actions.fetchDependencyInfo();
            setShowDiff(false);
          }}
          onRejectAll={async () => {
            await Promise.all(
              previewOps.map((op) =>
                fetch(`/api/ai/bulk-preview/${op.id}`, {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ operation: op }),
                }),
              ),
            );
            setPreviewOps([]);
            actions.fetchTodos();
            actions.fetchDependencyInfo();
            setShowDiff(false);
          }}
          onClose={() => setShowDiff(false)}
        />
      )}

      {/* Add task bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#FFFFF8] dark:bg-gray-900 px-4 py-3 flex gap-2 items-center z-[40] transition-colors duration-200">
        <button
          onClick={() => setAiMode((prev) => !prev)}
          className="border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-blue-600 hover:text-white rounded-md py-2 px-1 transition-colors duration-200"
        >
          {aiMode ? 'Back' : 'Try Me'}
        </button>
        {aiMode ? (
          <>
            <input
              type="text"
              placeholder="Describe your changes..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiPrompt()}
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-80 bg-[#FFFFF8] dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            />
            <button
              onClick={handleAiPrompt}
              className="border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-green-900 dark:hover:bg-blue-700 hover:text-white rounded-md p-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!aiPrompt.trim() || aiLoading}
            >
              {aiLoading ? 'Processing...' : 'Go'}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="add a task..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-[#FFFFF8] dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            />
            <CustomCalendar
              value={newDueDate}
              onChange={(date) => setNewDueDate(date)}
              className="w-32 p-2"
              openDirection="up"
            />
            <input
              type="number"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              min="1"
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-16 bg-[#FFFFF8] dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
            />
            <button
              onClick={handleAddTask}
              className="border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-green-900 dark:hover:bg-blue-700 hover:text-white hover:border-green-900 dark:hover:border-blue-700 rounded-md p-2 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newTitle.trim() || state.loading}
            >
              {state.loading ? 'Adding...' : 'Add'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <TimelineProvider>
        <HomeContent />
      </TimelineProvider>
    </ErrorBoundary>
  );
}
