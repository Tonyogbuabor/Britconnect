/**
 * BritConnect AI Customer Churn Intelligence Platform
 * Main Application Shell & View Routing
 */
import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './ui/Sidebar';
import { TopBar } from './ui/TopBar';
import { GuidedTourModal } from './ui/GuidedTourModal';
import { AnalystChatModal } from './chat/AnalystChatModal';

// Views
import { HomeView } from './views/HomeView';
import { QualityView } from './views/QualityView';
import { DashboardView } from './views/DashboardView';
import { ExplorerView } from './views/ExplorerView';
import { ModelLabView } from './views/ModelLabView';
import { ScoringView } from './views/ScoringView';
import { ExplainView } from './views/ExplainView';
import { SegmentsView } from './views/SegmentsView';
import { PlaybookView } from './views/PlaybookView';
import { CampaignView } from './views/CampaignView';
import { AnalystView } from './views/AnalystView';
import { ReportsView } from './views/ReportsView';
import { ExecutiveSummaryView } from './views/ExecutiveSummaryView';
import { SettingsDocsView } from './views/SettingsDocsView';

const PIPELINE_STEPS = [
  { id: 'home', label: 'Upload' },
  { id: 'quality', label: 'Validate & Clean' },
  { id: 'models', label: 'Feature & Train' },
  { id: 'scoring', label: 'Score Risk' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'playbook', label: 'Act & Save' },
  { id: 'executive_summary', label: 'Executive Report' },
];

export default function App() {
  const currentView = useAppStore((s) => s.currentView);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const initApp = useAppStore((s) => s.initApp);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    initApp();
  }, [initApp]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF6EC] text-[#2B3A33] font-sans antialiased">
      {/* 1. Left Sidebar (Collapsible) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Sticky Top Bar */}
        <TopBar />

        {/* Pipeline Stepper Breadcrumb Ribbon */}
        <div className="hidden sm:flex items-center justify-between px-6 py-2 bg-[#FFFDF7] border-b border-[#E6DFC8]/70 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="font-semibold text-[#7A877F] uppercase tracking-wider text-[10px] mr-1">
              Workflow Stepper:
            </span>
            {PIPELINE_STEPS.map((step, idx) => {
              const isCurrent = currentView === step.id;
              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && <span className="text-[#E6DFC8]">→</span>}
                  <button
                    type="button"
                    onClick={() => setCurrentView(step.id as any)}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                      isCurrent
                        ? 'bg-[#14633F] text-white font-semibold'
                        : 'text-[#7A877F] hover:text-[#0B3D2E]'
                    }`}
                  >
                    {step.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[11px] text-[#7A877F]">
            <span>Deterministic Math Verified</span>
            <span aria-hidden="true">·</span>
            <span>Zero Target Leakage</span>
          </div>
        </div>

        {/* Scrollable View Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentView === 'home' && <HomeView />}
          {currentView === 'quality' && <QualityView />}
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'explorer' && <ExplorerView />}
          {currentView === 'models' && <ModelLabView />}
          {currentView === 'scoring' && <ScoringView />}
          {currentView === 'explain' && <ExplainView />}
          {currentView === 'segments' && <SegmentsView />}
          {currentView === 'playbook' && <PlaybookView />}
          {currentView === 'campaigns' && <CampaignView />}
          {currentView === 'analyst' && <AnalystView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'executive_summary' && <ExecutiveSummaryView />}
          {currentView === 'settings' && <SettingsDocsView />}
        </main>
      </div>

      {/* Floating AI Analyst Chat Modal */}
      <AnalystChatModal />

      {/* 5-Step Guided Tour Modal */}
      <GuidedTourModal />
    </div>
  );
}
