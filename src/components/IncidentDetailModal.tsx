"use client";

import { useDashboard } from "@/lib/dashboard-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Flame,
  ShieldAlert,
  Zap,
  Info,
  Camera,
  Brain,
} from "lucide-react";
import Image from "next/image";

const severityColors: Record<string, string> = {
  Critical: "from-red-500/20 to-red-900/10",
  High: "from-orange-500/20 to-orange-900/10",
  Medium: "from-amber-500/20 to-amber-900/10",
  Low: "from-blue-500/20 to-blue-900/10",
};

const severityIcons: Record<string, React.ReactNode> = {
  Critical: <Flame className="w-5 h-5 text-red-400" />,
  High: <ShieldAlert className="w-5 h-5 text-orange-400" />,
  Medium: <Zap className="w-5 h-5 text-amber-400" />,
  Low: <Info className="w-5 h-5 text-blue-400" />,
};

const severityBorderColors: Record<string, string> = {
  Critical: "border-red-500/40",
  High: "border-orange-500/40",
  Medium: "border-amber-500/40",
  Low: "border-blue-500/40",
};

export default function IncidentDetailModal() {
  const { incidents, selectedIncidentId, selectIncident, acknowledgeIncident } =
    useDashboard();

  const incident = incidents.find((i) => i.id === selectedIncidentId);

  return (
    <AnimatePresence>
      {incident && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => selectIncident(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-2xl glass-panel max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Severity gradient header */}
            <div
              className={`bg-gradient-to-r ${severityColors[incident.severity]} px-6 py-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-black/30">
                    {severityIcons[incident.severity]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Incident {incident.id.toUpperCase()}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {incident.type} — {incident.severity} Severity
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => selectIncident(null)}
                  className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* ── IMAGE ANALYSIS VIEW ── */}
              {/* The exact frame Gemini analyzed with AI-detected labels */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground">
                    ANALYZED FRAME — AI DETECTED
                  </h4>
                </div>
                <div
                  className={`relative rounded-xl overflow-hidden border-2 ${severityBorderColors[incident.severity]} bg-zinc-950`}
                >
                  {/* Frame image (uses frameUrl if available, else placeholder) */}
                  {incident.frameUrl ? (
                    <Image
                      src={incident.frameUrl}
                      alt={`Analyzed frame from ${incident.cameraName}`}
                      width={640}
                      height={360}
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-zinc-900 via-zinc-800/50 to-zinc-900 flex items-center justify-center relative">
                      {/* Simulated analyzed frame with detection overlays */}
                      <div className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                        }}
                      />
                      <div className="text-center z-10">
                        <Brain className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500 font-mono">
                          Impact Frame — {incident.cameraName}
                        </p>
                      </div>

                      {/* AI detection bounding box overlay */}
                      <div className="absolute top-[20%] left-[15%] w-[45%] h-[55%] border-2 border-dashed border-red-500/60 rounded-lg">
                        <span className="absolute -top-5 left-0 text-[9px] font-mono bg-red-500/80 text-white px-1.5 py-0.5 rounded">
                          {incident.type} detected
                        </span>
                      </div>

                      {/* Second detection box for multi-vehicle */}
                      {incident.type === "Multi-vehicle" && (
                        <div className="absolute top-[30%] right-[10%] w-[25%] h-[40%] border-2 border-dashed border-orange-500/60 rounded-lg">
                          <span className="absolute -top-5 right-0 text-[9px] font-mono bg-orange-500/80 text-white px-1.5 py-0.5 rounded">
                            Vehicle 2
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Severity / Type / Action overlay labels on frame */}
                  <div className="absolute bottom-0 left-0 right-0 glassmorphism px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        incident.severity === "Critical"
                          ? "bg-red-500/20 text-red-400"
                          : incident.severity === "High"
                          ? "bg-orange-500/20 text-orange-400"
                          : incident.severity === "Medium"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono">
                        {incident.type}
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {incident.emergencyPriority >= 7 ? "🚨 DISPATCH NOW" : "📋 MONITOR"}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Analysis Text */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground">
                    GEMINI 2.0 FLASH — ANALYSIS
                  </h4>
                </div>
                <div className="glass-card p-4">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {incident.description}
                  </p>
                  {/* Structured JSON output preview */}
                  <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-zinc-400">
                    <span className="text-zinc-600">{"{"}</span><br />
                    &nbsp;&nbsp;<span className="text-primary">&quot;accident&quot;</span>: <span className="text-safe">true</span>,<br />
                    &nbsp;&nbsp;<span className="text-primary">&quot;severity&quot;</span>: <span className="text-amber-400">&quot;{incident.severity}&quot;</span>,<br />
                    &nbsp;&nbsp;<span className="text-primary">&quot;type&quot;</span>: <span className="text-amber-400">&quot;{incident.type}&quot;</span>,<br />
                    &nbsp;&nbsp;<span className="text-primary">&quot;emergency_priority&quot;</span>: <span className="text-orange-400">{incident.emergencyPriority}</span><br />
                    <span className="text-zinc-600">{"}"}</span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-muted-foreground font-semibold tracking-wider">
                      CAMERA
                    </span>
                  </div>
                  <p className="text-sm font-mono text-zinc-300">
                    {incident.cameraName}
                  </p>
                </div>
                <div className="glass-card p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-muted-foreground font-semibold tracking-wider">
                      TIMESTAMP
                    </span>
                  </div>
                  <p className="text-sm font-mono text-zinc-300">
                    {new Date(incident.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="glass-card p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                    <span className="text-[10px] text-muted-foreground font-semibold tracking-wider">
                      PRIORITY
                    </span>
                  </div>
                  <p className="text-sm font-mono text-zinc-300">
                    {incident.emergencyPriority} / 10
                  </p>
                </div>
                <div className="glass-card p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Phone className="w-3.5 h-3.5 text-safe" />
                    <span className="text-[10px] text-muted-foreground font-semibold tracking-wider">
                      RECOMMENDED ACTION
                    </span>
                  </div>
                  <p className="text-sm font-mono text-zinc-300">
                    {incident.emergencyPriority >= 8
                      ? "Dispatch EMS + Police"
                      : incident.emergencyPriority >= 5
                      ? "Dispatch Road Crew"
                      : "Continue Monitoring"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {!incident.acknowledged && (
                  <button
                    onClick={() => acknowledgeIncident(incident.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-safe/20 hover:bg-safe/30 text-safe text-sm font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => selectIncident(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
