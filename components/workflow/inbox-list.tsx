"use client";

import { MOCK_INTENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Mail, Hash, CheckCircle2, Wifi } from "lucide-react";
import { motion } from "framer-motion";

interface InboxListProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  completedTasks?: string[];
  liveIntents?: any[];
}

export default function InboxList({ activeId, onSelect, completedTasks = [], liveIntents = [] }: InboxListProps) {
  const allIntents = [...liveIntents, ...MOCK_INTENTS];

  return (
    <div className="flex flex-col gap-1">
      {liveIntents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg bg-green-500/5 border border-green-500/15"
        >
          <Wifi size={11} className="text-green-500" />
          <span className="text-[10px] text-green-500 font-medium">
            {liveIntents.length} live from Slack
          </span>
        </motion.div>
      )}

      {allIntents.map((intent, index) => {
        const isActive = activeId === intent.id;
        const isCompleted = completedTasks.includes(intent.id);
        const isSlack = intent.sourceApp === "Slack";
        const isNew = liveIntents.some((l) => l.id === intent.id);

        return (
          <motion.button
            key={intent.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => !isCompleted && onSelect(intent.id)}
            disabled={isCompleted}
            className={cn(
              "text-left p-3 rounded-lg transition-all duration-200 border w-full relative",
              isCompleted
                ? "bg-transparent border-transparent opacity-35 cursor-default"
                : isActive
                ? "bg-surface border-surface-border shadow-sm"
                : "bg-transparent border-transparent hover:bg-surface/50 cursor-pointer"
            )}
          >
            {isNew && !isCompleted && (
              <span className="absolute top-2 right-2 text-[9px] font-bold text-green-500 border border-green-500/30 rounded-full px-1.5 py-0.5 bg-green-500/10">
                NEW
              </span>
            )}

            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ghost-highlight uppercase tracking-wider">
                {isSlack ? <Hash size={11} /> : <Mail size={11} />}
                <span>{intent.sourceApp}</span>
              </div>
              {intent.urgency === "High" && !isCompleted && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/60 ml-auto" />
              )}
              {isCompleted && <CheckCircle2 size={13} className="text-ghost-highlight ml-auto" />}
            </div>

            <div className={cn("text-sm font-medium mb-1 truncate pr-8", isCompleted ? "text-ghost-highlight" : "text-foreground")}>
              {intent.sender}
            </div>

            <div className="text-xs text-ghost-highlight line-clamp-2 leading-relaxed">
              {intent.snippet}
            </div>

            {isActive && !isCompleted && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                className="mt-2 h-[1px] bg-gradient-to-r from-foreground/30 to-transparent rounded"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}