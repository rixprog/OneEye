"use client";

import { useDashboard } from "@/lib/dashboard-context";
import {
  Eye,
  EyeOff,
  Activity,
  Radio,
  ShieldAlert,
  Clock,
} from "lucide-react";

export default function TopBar() {
  const { cameras, incidents, sidebarOpen, toggleSidebar } = useDashboard();
  const activeIncidents = incidents.filter((i) => !i.acknowledged).length;
  const onlineCams = cameras.filter((c) => c.status !== "offline").length;

  return (
    <header className="shrink-0 px-5 py-3 flex items-center justify-between border-b border-border/50 glassmorphism">
      {/* Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 flex items-center justify-center animate-gradient">
              <Eye className="w-5 h-5 text-white" />
            </div>
            {activeIncidents > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold flex items-center justify-center text-white ring-2 ring-background">
                {activeIncidents}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-glow">
              ONE EYE
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-widest">
              ROAD HAZARD SENTRY
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border/50" />

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-safe animate-pulse-dot" />
            <span className="text-[11px] text-muted-foreground font-mono">
              {onlineCams} FEEDS
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[11px] text-muted-foreground font-mono">
              {activeIncidents} ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground font-mono">
              GEMINI 2.0 FLASH
            </span>
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
          <Clock className="w-3 h-3" />
          <span suppressHydrationWarning>
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          title={sidebarOpen ? "Hide incidents" : "Show incidents"}
        >
          {sidebarOpen ? (
            <EyeOff className="w-4 h-4 text-zinc-400" />
          ) : (
            <Eye className="w-4 h-4 text-zinc-400" />
          )}
        </button>
      </div>
    </header>
  );
}
