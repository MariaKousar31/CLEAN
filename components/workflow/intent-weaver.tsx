"use client";

import { MOCK_INTENTS } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import GhostSimulation from "./ghost-simulation";
import { useState, useEffect } from "react";
import type { Easing } from "framer-motion";
import type { ExecutionStatus } from "@/app/app/page";

const EASE: Easing = [0.16, 1, 0.3, 1];

interface IntentWeaverProps {
  taskId: string;
  intentData?: any; // full intent object passed from parent (for live Slack intents)
  executionStatus: ExecutionStatus;
  onActionsReady?: (actions: any[]) => void;
}

export default function IntentWeaver({ taskId, intentData, executionStatus, onActionsReady }: IntentWeaverProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [checkedActions, setCheckedActions] = useState<string[]>([]);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    setError(false);
    setData(null);

    // Use passed intentData text if available (live Slack), else find in mock
    const source = intentData || MOCK_INTENTS.find((i) => i.id === taskId);
    const messageText = source?.fullText || "Process this workflow request";
    const sourceApp = source?.sourceApp || "Slack";
    const sender = source?.sender || "Unknown";

    fetch("/api/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: messageText, sourceApp, sender }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.error) throw new Error(result.error);
        // Preserve original message text
        setData({ ...result, fullText: messageText });
        const ids = result.actions.map((a: any) => a.id);
        setCheckedActions(ids);
        onActionsReady?.(result.actions);
      })
      .catch(() => {
        // Fallback to source data
        if (source) {
          setData(source);
          setCheckedActions(source.actions.map((a: any) => a.id));
          onActionsReady?.(source.actions);
        }
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [taskId]);

  function toggleAction(id: string) {
    setCheckedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 text-center">
        <Loader2 size={22} className="text-ghost-highlight animate-spin" />
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Extracting intent...</p>
          <p className="text-xs text-ghost-highlight">AI is reading the message</p>
        </div>
        {intentData && (
          <div className="max-w-md p-4 rounded-xl border border-surface-border bg-surface/20 text-left">
            <p className="text-[10px] text-ghost-highlight uppercase tracking-widest mb-2">Message from {intentData.sourceApp}</p>
            <p className="text-sm text-foreground/80 italic leading-relaxed">"{intentData.fullText}"</p>
          </div>
        )}
      </motion.div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-2xl w-full mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">

        {error && (
          <div className="text-[10px] text-ghost-highlight border border-surface-border/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/70 shrink-0" />
            Using fallback data
          </div>
        )}

        {/* Origin message */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold text-ghost-highlight uppercase tracking-wider">
              Origin · {data.sourceApp}
            </span>
            <span className="text-[10px] text-ghost-highlight border border-surface-border rounded-full px-2 py-0.5">
              {data.sender}
            </span>
          </div>
          <blockquote className="text-lg md:text-xl font-medium text-foreground leading-snug border-l-2 border-surface-border pl-4">
            {data.fullText}
          </blockquote>
        </motion.div>

        {/* Connector */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-col items-center">
          <div className="w-[1px] h-6 bg-gradient-to-b from-surface-border to-transparent" />
          <div className="bg-surface border border-surface-border text-[10px] text-ghost-highlight px-3 py-1 rounded-full flex items-center gap-2 -my-2 z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
            AI extracted · {data.actions.length} actions
          </div>
          <div className="w-[1px] h-6 bg-gradient-to-t from-surface-border to-transparent" />
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-ghost-highlight uppercase tracking-wider">Suggested Workflow</span>
            <span className="text-[10px] text-ghost-highlight">{checkedActions.length}/{data.actions.length} selected</span>
          </div>

          <div className="flex flex-col gap-2">
            {data.actions.map((action: any, i: number) => {
              const isChecked = checkedActions.includes(action.id);
              const isExpanded = expandedAction === action.id;
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                    isChecked ? "border-surface-border bg-surface/20" : "border-surface-border/30 opacity-40"
                  }`}
                >
                  <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleAction(action.id)} className="shrink-0 text-ghost-highlight hover:text-foreground transition-colors">
                        {isChecked ? <CheckCircle2 size={16} className="text-foreground" /> : <Circle size={16} />}
                      </button>
                      <div className="w-7 h-7 rounded-md bg-surface border border-surface-border flex items-center justify-center text-[11px] font-semibold shrink-0">
                        {action.app.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{action.action}</div>
                        <div className="text-xs text-ghost-highlight">{action.app} · {action.details}</div>
                      </div>
                    </div>
                    <button onClick={() => setExpandedAction(isExpanded ? null : action.id)} className="text-ghost-highlight hover:text-foreground transition-colors p-1">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-surface-border px-4 py-3 bg-surface/10"
                      >
                        <p className="text-xs text-ghost-highlight leading-relaxed">
                          Connects to <strong className="text-foreground">{action.app}</strong> and {action.action.toLowerCase()}: <em>{action.details}</em>
                        </p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-[10px] text-ghost-highlight border border-surface-border rounded px-2 py-1">~4s</span>
                          <span className="text-[10px] text-ghost-highlight border border-surface-border rounded px-2 py-1">Reversible</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Ghost Simulation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <GhostSimulation simulation={data.simulation} />
        </motion.div>
      </motion.div>
    </div>
  );
}