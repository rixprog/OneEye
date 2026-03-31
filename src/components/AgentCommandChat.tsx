"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Terminal,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export default function AgentCommandChat() {
  const { chatMessages, addChatMessage } = useDashboard();
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addChatMessage({ role: "user", content: trimmed });
    setInput("");
  };

  return (
    <div className="border-t border-border/50 flex flex-col bg-black/30 shrink-0">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Terminal className="w-4 h-4 text-primary" />
            <Sparkles className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1.5" />
          </div>
          <span className="text-xs font-semibold tracking-wide">
            SYSTEM COMMANDER
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            AI-POWERED
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 240 }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="flex flex-col overflow-hidden"
          >
            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role !== "user" && (
                      <div className="shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary/20 text-zinc-200 rounded-br-sm"
                          : msg.role === "system"
                          ? "bg-zinc-800/50 text-zinc-500 italic"
                          : "bg-white/5 text-zinc-300 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                      {msg.toolCall && (
                        <div className="mt-2 px-2 py-1.5 rounded-lg bg-black/30 border border-white/5 font-mono text-[10px] text-primary/80">
                          ⚡ {msg.toolCall.name}(
                          {JSON.stringify(msg.toolCall.args)})
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 glassmorphism rounded-xl px-3 py-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Issue a command… e.g. &quot;Show me Cam 2&quot;"
                  className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none py-1.5"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 disabled:opacity-30 transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
