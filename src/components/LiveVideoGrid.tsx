"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { CameraFeed } from "@/lib/types";
import { useDashboard } from "@/lib/dashboard-context";
import { motion } from "framer-motion";
import {
  Video,
  VideoOff,
  AlertTriangle,
  CheckCircle,
  Maximize2,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";

function StatusBadge({ status }: { status: CameraFeed["status"] }) {
  const config = {
    clear: {
      color: "bg-safe",
      icon: <CheckCircle className="w-3 h-3" />,
      label: "CLEAR",
    },
    alert: {
      color: "bg-destructive",
      icon: <AlertTriangle className="w-3 h-3" />,
      label: "ALERT",
    },
    offline: {
      color: "bg-muted-foreground",
      icon: <VideoOff className="w-3 h-3" />,
      label: "OFFLINE",
    },
  };
  const c = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white ${c.color}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function VideoPlayer({ camera }: { camera: CameraFeed }) {
  const { focusedCameraId, focusCamera } = useDashboard();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const isFocused = focusedCameraId === camera.id;
  const isAlert = camera.status === "alert";
  const isOffline = camera.status === "offline";

  // Attempt to play video when component mounts
  useEffect(() => {
    if (videoRef.current && !isOffline) {
      videoRef.current.play().catch(() => {
        // Video file may not exist yet, gracefully degrade to placeholder
      });
    }
  }, [isOffline]);

  const handleVideoError = useCallback(() => {
    setHasVideoError(true);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  return (
    <motion.div
      layout
      id={`video-player-${camera.id}`}
      className={`relative group rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
        isFocused ? "col-span-2 row-span-2 z-10" : ""
      } ${isAlert ? "glow-red" : ""} ${
        isFocused ? "ring-2 ring-primary/60" : ""
      }`}
      onClick={() => focusCamera(isFocused ? null : camera.id)}
      whileHover={{ scale: isFocused ? 1 : 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Video / placeholder area */}
      <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
        {isOffline ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/90">
            <VideoOff className="w-10 h-10 text-zinc-600" />
            <span className="text-xs text-zinc-500 font-mono">
              SIGNAL LOST
            </span>
          </div>
        ) : (
          <>
            {/* Actual <video> element for looping .mp4 feeds */}
            {!hasVideoError && (
              <video
                ref={videoRef}
                src={camera.videoSrc}
                loop
                muted={isMuted}
                playsInline
                autoPlay
                onError={handleVideoError}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Fallback: Gradient + noise overlay when video not available */}
            {hasVideoError && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/80 via-zinc-900/60 to-black/90" />
                <div
                  className="absolute inset-0 opacity-[0.15]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
                  }}
                />
              </>
            )}

            {/* Dark overlay on top of video for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

            {/* Scanner line for alert cameras */}
            {isAlert && (
              <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/80 to-transparent animate-scanner" />
            )}

            {/* Camera name center display (shown when no video or always as an overlay) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Video className="w-8 h-8 text-white/40 mx-auto mb-2" />
                <p className="text-white/70 font-mono text-sm font-semibold drop-shadow-lg">
                  {camera.name}
                </p>
                <p className="text-white/40 font-mono text-[10px] mt-1 drop-shadow">
                  {camera.location}
                </p>
              </div>
            </div>

            {/* REC indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
              <span className="text-[9px] font-bold tracking-widest text-white/70 font-mono">
                REC
              </span>
            </div>

            {/* Timestamp overlay */}
            <div className="absolute top-3 right-12 pointer-events-none">
              <span
                className="text-[9px] font-mono text-white/50"
                suppressHydrationWarning
              >
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </>
        )}

        {/* Alert pulse ring */}
        {isAlert && !isOffline && (
          <div className="absolute top-3 right-3">
            <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-500 animate-pulse-ring" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500 animate-pulse-dot" />
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 glassmorphism px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <StatusBadge status={camera.status} />
          <span className="text-[11px] text-zinc-400 font-mono truncate">
            {camera.location}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Mute/unmute on focused */}
          {isFocused && !isOffline && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          )}
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              focusCamera(isFocused ? null : camera.id);
            }}
          >
            {isFocused ? (
              <X className="w-4 h-4 text-zinc-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function LiveVideoGrid() {
  const { cameras, focusedCameraId } = useDashboard();

  // If a camera is focused, show it large + others smaller
  const sortedCameras = focusedCameraId
    ? [
        cameras.find((c) => c.id === focusedCameraId)!,
        ...cameras.filter((c) => c.id !== focusedCameraId),
      ]
    : cameras;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-5 py-3 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-safe animate-pulse-dot" />
          <h2 className="text-sm font-semibold tracking-wide">LIVE FEEDS</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {cameras.filter((c) => c.status !== "offline").length}/
            {cameras.length} ONLINE
          </span>
        </div>
      </div>

      <motion.div
        layout
        className={`flex-1 grid gap-3 p-4 auto-rows-fr ${
          focusedCameraId
            ? "grid-cols-3"
            : "grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {sortedCameras.map((camera) => (
          <VideoPlayer key={camera.id} camera={camera} />
        ))}
      </motion.div>
    </div>
  );
}
