"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocus } from "@/components/shared/focus-toggle";
import { Eye, EyeOff, Plus, Command } from "lucide-react";
import { MOCK_INTENTS } from "@/lib/mock-data";

import InboxList from "@/components/workflow/inbox-list";
import IntentWeaver from "@/components/workflow/intent-weaver";
import ApprovalBar from "@/components/workflow/approval-bar";
import PostExecution from "@/components/workflow/post-execution";

export type ExecutionStatus = "idle" | "executing" | "success" | "rejected";

export default function AppScreen() {
  const { isFocusMode, toggleFocusMode } = useFocus();
  const [activeTaskId, setActiveTaskId] = useState<string | null>("task-1");
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>("idle");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [lastExecutedId, setLastExecutedId] = useState<string | null>(null);
  const [currentActions, setCurrentActions] = useState<any[]>([]);
  const [lastActions, setLastActions] = useState<string[]>([]);
  const [timeSaved, setTimeSaved] = useState(0);
  const [contextSwitches, setContextSwitches] = useState(0);

  // Store for live intents from Slack
  const [liveIntents, setLiveIntents] = useState<any[]>([]);

  // Poll for live Slack intents every 3 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/intents/pending");
        const data = await res.json();
        if (data.intents?.length > 0) {
          setLiveIntents(data.intents);
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  // All intents = live + mock
  const allIntents = [...liveIntents, ...MOCK_INTENTS];

  // Get full intent data by id (live or mock)
  function getIntentById(id: string) {
    return allIntents.find((i) => i.id === id) || null;
  }

  async function handleApprove() {
    if (!activeTaskId) return;
    setExecutionStatus("executing");

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: activeTaskId, actions: currentActions }),
      });
      const result = await res.json();
      if (!result.success) throw new Error();
    } catch {}

    setLastExecutedId(activeTaskId);
    setLastActions(currentActions.map((a) => `${a.app} · ${a.action}`));
    setCompletedTasks((prev) => [...prev, activeTaskId]);
    setExecutionStatus("success");
  }

  function handleReject() {
    setExecutionStatus("rejected");
    setTimeout(() => {
      setExecutionStatus("idle");
      setActiveTaskId(null);
    }, 700);
  }

  function handleBackToInbox() {
    setExecutionStatus("idle");
    setActiveTaskId(null);
  }

  function handleUndo() {
    if (!lastExecutedId) return;
    setCompletedTasks((prev) => prev.filter((id) => id !== lastExecutedId));
    setActiveTaskId(lastExecutedId);
    setLastExecutedId(null);
    setExecutionStatus("idle");
  }

  function handleSelect(id: string) {
    if (executionStatus !== "idle") return;
    setActiveTaskId(id);
  }

  function handleActionsReady(actions: any[]) {
    setCurrentActions(actions);
    const intent = getIntentById(activeTaskId || "");
    setTimeSaved(intent?.simulation?.timeSavedMinutes ?? 5);
    setContextSwitches(intent?.simulation?.contextSwitchesAvoided ?? 2);
  }

  const activeIntent = getIntentById(activeTaskId || "");

  return (
    <div className="flex w-full h-full relative">

      {/* SIDEBAR */}
      <aside className={`border-r border-surface-border bg-surface/20 flex flex-col shrink-0 focus-dampen transition-all duration-500 ${
        isFocusMode ? "w-0 overflow-hidden border-none opacity-0" : "w-72 opacity-100"
      }`}>
        <div className="p-4 border-b border-surface-border flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-semibold text-ghost-highlight uppercase tracking-wider">Intercepted Intent</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-ghost-highlight">
                Live · {allIntents.length - completedTasks.length} pending
              </span>
            </div>
          </div>
          <button onClick={toggleFocusMode} className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border text-ghost-highlight hover:text-foreground hover:bg-surface transition-all">
            <Eye size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <InboxList
            activeId={activeTaskId}
            onSelect={handleSelect}
            completedTasks={completedTasks}
            liveIntents={liveIntents}
          />
        </div>

        <div className="p-3 border-t border-surface-border">
          <div className="flex items-center gap-2 text-[10px] text-ghost-highlight">
            <Command size={10} />
            <span>⌘ + Enter to execute · Esc to dismiss</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <section className="flex-1 flex flex-col relative is-active overflow-hidden">

        <div className="h-11 border-b border-surface-border flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            {isFocusMode && (
              <button onClick={toggleFocusMode} className="flex items-center gap-1.5 text-xs text-ghost-highlight hover:text-foreground transition-colors">
                <EyeOff size={12} /> Show Inbox
              </button>
            )}
            <span className="text-xs text-ghost-highlight">
              {executionStatus === "executing" ? "Executing workflow..."
                : executionStatus === "success" ? "Done — what's next?"
                : activeTaskId ? "Review & approve below"
                : "Select a message to begin"}
            </span>
          </div>
          {completedTasks.length > 0 && (
            <div className="text-[10px] text-ghost-highlight border border-surface-border rounded px-2 py-1">
              ✓ {completedTasks.length} executed today
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">

            {executionStatus === "executing" && (
              <motion.div key="executing" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8 text-center">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border border-surface-border animate-spin [border-top-color:theme(colors.foreground)]" />
                  <div className="absolute inset-[5px] rounded-full border border-surface-border/40 animate-spin [animation-direction:reverse] [animation-duration:0.75s] [border-bottom-color:theme(colors.ghost.DEFAULT)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Executing Workflow</p>
                  <p className="text-xs text-ghost-highlight">Calling APIs across your apps...</p>
                </div>
                <div className="flex flex-col gap-2.5 w-full max-w-sm">
                  {currentActions.map((action, i) => (
                    <motion.div key={action.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.3 }} className="flex items-center gap-3 p-3 rounded-lg border border-surface-border bg-surface/20">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.3 + 0.15, type: "spring" }} className="w-4 h-4 rounded-full border border-surface-border flex items-center justify-center shrink-0">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.3 + 0.3 }} className="w-1.5 h-1.5 rounded-full bg-foreground" />
                      </motion.div>
                      <span className="text-xs text-foreground/80">{action.app} · {action.action}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {executionStatus === "success" && (
              <PostExecution
                key="success"
                completedCount={completedTasks.length}
                lastActions={lastActions}
                timeSaved={timeSaved}
                contextSwitches={contextSwitches}
                onViewInbox={handleBackToInbox}
                onUndo={handleUndo}
              />
            )}

            {(executionStatus === "idle" || executionStatus === "rejected") && activeTaskId && (
              <IntentWeaver
                key={activeTaskId}
                taskId={activeTaskId}
                intentData={activeIntent}
                executionStatus={executionStatus}
                onActionsReady={handleActionsReady}
              />
            )}

            {(executionStatus === "idle" || executionStatus === "rejected") && !activeTaskId && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 text-center max-w-xs">
                <div className="w-12 h-12 rounded-xl border border-surface-border flex items-center justify-center">
                  <Plus size={18} className="text-ghost-highlight" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {completedTasks.length === allIntents.length ? "All caught up 🎉" : "No active intent"}
                  </p>
                  <p className="text-xs text-ghost-highlight leading-relaxed">
                    {completedTasks.length === allIntents.length
                      ? "You've cleared the inbox. Nice work."
                      : "Pick a message from the inbox to review its workflow."}
                  </p>
                </div>
                {completedTasks.length > 0 && (
                  <div className="text-xs text-ghost-highlight border border-surface-border rounded-lg px-4 py-2.5">
                    ✓ {completedTasks.length} workflow{completedTasks.length > 1 ? "s" : ""} executed this session
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <AnimatePresence>
          {activeTaskId && executionStatus === "idle" && (
            <ApprovalBar onApprove={handleApprove} onReject={handleReject} />
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}