import React from 'react';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Sparkles,
  Map as MapIcon,
  CalendarClock,
  ListTodo,
  FileSpreadsheet,
  Cpu,
  ScrollText,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'projects'
  | 'parcels'
  | 'predictions'
  | 'map'
  | 'milestones'
  | 'recommendations'
  | 'reports'
  | 'governance'
  | 'audit';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  openRecommendationsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  openRecommendationsCount = 0,
  isOpen = false,
  onClose,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Infrastructure Projects', icon: Building2 },
    { id: 'parcels', label: 'Land Parcels Register', icon: MapPin },
    { id: 'predictions', label: 'ML Prediction Studio', icon: Sparkles },
    { id: 'map', label: 'Interactive GIS Map', icon: MapIcon },
    { id: 'milestones', label: 'Milestones & Timeline', icon: CalendarClock },
    {
      id: 'recommendations',
      label: 'Action Center',
      icon: ListTodo,
      badge: openRecommendationsCount > 0 ? openRecommendationsCount : undefined,
    },
    { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet },
    { id: 'governance', label: 'ML Model Governance', icon: Cpu },
    { id: 'audit', label: 'Audit Log & History', icon: ScrollText },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] transition-transform duration-200 z-40 ${
          isOpen
            ? 'fixed inset-y-0 left-0 pt-16 md:pt-0'
            : 'hidden md:flex'
        }`}
      >
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white text-emerald-800' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Model Status Pill in Sidebar footer */}
      <div className="mt-auto p-4 border-t border-slate-800/80">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Model Pipeline</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
            </span>
          </div>
          <p className="font-mono text-slate-200 text-[11px] mt-1 font-semibold">RandomForest v2.4.1</p>
          <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
            <span>ROC-AUC: 0.884</span>
            <span>MAE: 14.8d</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
