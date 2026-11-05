/**
 * BritConnect Navigation Sidebar
 * Dark-green background (#0B3D2E) with Gold (#D4AF37) active indicator
 * 13 canonical sections in required order, collapsible to icon rail
 */
import React from 'react';
import {
  Database,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Cpu,
  Target,
  HelpCircle,
  PieChart,
  BookOpen,
  Send,
  Bot,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { useAppStore, AppNavView } from '../store/useAppStore';

interface NavItem {
  id: AppNavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Data Hub', icon: Database },
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'executive_summary', label: 'Executive Summary', icon: Award, badge: 'Exec' },
  { id: 'quality', label: 'Quality & Cleaning', icon: ShieldCheck },
  { id: 'explorer', label: 'Customer Explorer', icon: Users },
  { id: 'models', label: 'Model Lab', icon: Cpu },
  { id: 'scoring', label: 'Risk Scoring', icon: Target },
  { id: 'explain', label: 'Explainability', icon: HelpCircle },
  { id: 'segments', label: 'Segmentation', icon: PieChart },
  { id: 'playbook', label: 'Retention Playbook', icon: BookOpen },
  { id: 'campaigns', label: 'Campaign Tracker', icon: Send },
  { id: 'analyst', label: 'AI Analyst', icon: Bot, badge: 'AI' },
  { id: 'reports', label: 'Reports & Exports', icon: FileText },
  { id: 'settings', label: 'Settings & Docs', icon: Settings },
];

export const Sidebar: React.FC<{
  collapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ collapsed, onToggleCollapse }) => {
  const currentView = useAppStore((s) => s.currentView);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const qualityReport = useAppStore((s) => s.qualityReport);
  const setFirstRunTourStep = useAppStore((s) => s.setFirstRunTourStep);

  return (
    <aside
      className={`bg-[#0B3D2E] text-[#FFFDF7] flex flex-col justify-between shrink-0 transition-all duration-300 z-30 select-none border-r border-[#0B3D2E]/80 ${
        collapsed ? 'w-[72px]' : 'w-[250px]'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B3D2E] text-sm shrink-0 shadow-xs">
                BC
              </div>
              <div className="truncate">
                <span className="font-serif-display font-bold text-base text-white tracking-tight block leading-tight">
                  BritConnect
                </span>
                <span className="text-[10px] text-[#F0E2B0] font-sans tracking-wide uppercase opacity-85">
                  Churn Intelligence
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B3D2E] text-sm mx-auto shadow-xs">
              BC
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 text-left relative group ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-xs'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {/* Gold Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#D4AF37] rounded-r-full" />
                )}

                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#D4AF37]' : 'text-white/60 group-hover:text-white'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate flex-1 tracking-tight">{item.label}</span>
                )}

                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-xs bg-[#D4AF37] text-[#0B3D2E] uppercase font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Guided Tour & Footer Status */}
      <div className="p-3 border-t border-white/10 bg-black/15">
        {!collapsed && (
          <button
            type="button"
            onClick={() => setFirstRunTourStep(1)}
            className="w-full mb-2 py-1.5 px-2.5 rounded-lg bg-[#14633F] hover:bg-[#2E9E6B] text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F0E2B0]" />
            <span>5-Step Guided Tour</span>
          </button>
        )}

        <div className={`flex items-center text-[11px] text-white/70 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="truncate">
              <span className="block text-[10px] text-white/50 uppercase">Quality Index</span>
              <span className="font-mono font-bold text-[#F0E2B0]">
                {qualityReport ? `${qualityReport.overallScore}/100 Score` : '98/100 A+'}
              </span>
            </div>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-white/10 text-white/80">
            v2.4
          </span>
        </div>
      </div>
    </aside>
  );
};
