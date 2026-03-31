"use client";

import { useDashboard } from "@/lib/dashboard-context";
import { Incident, Severity } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Zap,
  Info,
  Filter,
  X,
} from "lucide-react";

const severityConfig: Record<
  Severity,
  { color: string; bg: string; icon: React.ReactNode; border: string }
> = {
  Critical: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    icon: <Flame className="w-4 h-4 text-red-400" />,
    border: "border-l-red-500",
  },
  High: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    icon: <ShieldAlert className="w-4 h-4 text-orange-400" />,
    border: "border-l-orange-500",
  },
  Medium: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    border: "border-l-amber-500",
  },
  Low: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    icon: <Info className="w-4 h-4 text-blue-400" />,
    border: "border-l-blue-500",
  },
};

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

function IncidentCard({ incident }: { incident: Incident }) {
  const { selectIncident, focusCamera, selectedIncidentId, playAlertSound } = useDashboard();
  const config = severityConfig[incident.severity];
  const isSelected = selectedIncidentId === incident.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      whileHover={{ scale: 1.01 }}
      id={`incident-card-${incident.id}`}
      className={`relative border-l-[3px] ${config.border} glass-card p-3.5 cursor-pointer transition-all duration-300 ${
        isSelected
          ? "ring-1 ring-white/20 bg-white/5"
          : "hover:bg-white/[0.03]"
      } ${!incident.acknowledged ? "" : "opacity-60"}`}
      onClick={() => {
        selectIncident(isSelected ? null : incident.id);
        focusCamera(incident.cameraId);
        if (!incident.acknowledged) {
          playAlertSound();
        }
      }}
    >
      {/* Unacknowledged pulse */}
      {!incident.acknowledged && (
        <span className="absolute top-3 right-3">
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-red-400 animate-pulse-ring" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${config.bg} shrink-0`}>
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}
            >
              {incident.severity.toUpperCase()}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {incident.type}
            </span>
          </div>
          <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-2">
            {incident.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(incident.timestamp)}</span>
              <span className="mx-1 text-zinc-700">·</span>
              <span className="font-mono">{incident.cameraName}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${isSelected ? "rotate-90" : ""}`} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function IncidentSidebar() {
  const { incidents, filteredIncidents, sidebarOpen, clearFilter } = useDashboard();
  
  // Use filtered incidents if a filter is active, otherwise show all
  const displayIncidents = filteredIncidents !== null ? filteredIncidents : incidents;
  const isFiltered = filteredIncidents !== null;
  
  const active = displayIncidents.filter((i) => !i.acknowledged);
  const acknowledged = displayIncidents.filter((i) => i.acknowledged);

  if (!sidebarOpen) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 360, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full border-l border-border/50 flex flex-col bg-black/30 overflow-hidden shrink-0"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h2 className="text-sm font-semibold tracking-wide">INCIDENTS</h2>
        </div>
        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              onClick={clearFilter}
              className="flex items-center gap-1 bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full hover:bg-primary/30 transition-colors"
            >
              <Filter className="w-3 h-3" />
              FILTERED
              <X className="w-3 h-3" />
            </button>
          )}
          {active.length > 0 && (
            <span className="bg-destructive/20 text-destructive text-[10px] font-bold px-2 py-0.5 rounded-full">
              {active.length} ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Active Incidents */}
        {active.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {active.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Acknowledged */}
        {acknowledged.length > 0 && (
          <>
            <div className="flex items-center gap-2 pt-3 pb-1 px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-safe" />
              <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">
                ACKNOWLEDGED
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {acknowledged.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {displayIncidents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
            {isFiltered ? (
              <>
                <Filter className="w-8 h-8 mb-2" />
                <span className="text-xs">No incidents match this filter</span>
                <button
                  onClick={clearFilter}
                  className="mt-2 text-[10px] text-primary hover:underline"
                >
                  Clear filter
                </button>
              </>
            ) : (
              <>
                <ShieldCheck className="w-8 h-8 mb-2" />
                <span className="text-xs">All clear — no incidents</span>
              </>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
