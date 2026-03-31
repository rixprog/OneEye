"use client";

import { DashboardProvider } from "@/lib/dashboard-context";
import TopBar from "@/components/TopBar";
import LiveVideoGrid from "@/components/LiveVideoGrid";
import IncidentSidebar from "@/components/IncidentSidebar";
import AgentCommandChat from "@/components/AgentCommandChat";
import IncidentDetailModal from "@/components/IncidentDetailModal";

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Top Navigation */}
        <TopBar />

        {/* Main Content */}
        <div className="flex flex-1 min-h-0">
          {/* Left Panel: Video Grid + Chat */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <LiveVideoGrid />
            <AgentCommandChat />
          </div>

          {/* Right Panel: Incident Sidebar */}
          <IncidentSidebar />
        </div>

        {/* Incident Detail Overlay */}
        <IncidentDetailModal />
      </div>
    </DashboardProvider>
  );
}
