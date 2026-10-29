import React, { useState, useEffect } from 'react';
import { Project, User, NotificationItem, UserRole } from '../types';
import { api } from '../api/client';
import {
  Bell,
  CheckCircle,
  Building2,
  UserCheck,
  RotateCcw,
  Search,
  ExternalLink,
  Menu,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  onSearch?: (query: string) => void;
  onRefreshData?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  currentUser,
  onRoleChange,
  onRefreshData,
  onToggleSidebar,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.results);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    loadNotifications();
  };

  const handleResetDemoData = async () => {
    if (confirm('Reset synthetic database to default state (5 projects, 200 parcels, initial seed)?')) {
      setIsResetting(true);
      try {
        await api.resetDemoData();
        if (onRefreshData) onRefreshData();
        loadNotifications();
        alert('Synthetic database re-seeded successfully.');
      } catch (err: any) {
        alert(err.message);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & Project Selector */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-emerald-900/30">
              BP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">BhoomiPredict</span>
                <span className="text-[10px] font-semibold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded uppercase">
                  AI ML
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Predictive Land Acquisition Analytics</p>
            </div>
          </div>

          {/* Project Selector */}
          <div className="hidden md:flex items-center gap-2 ml-6 pl-6 border-l border-slate-800">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              aria-label="Filter by Infrastructure Project"
              value={selectedProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[220px] truncate"
            >
              <option value="all">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Admin Re-seed button */}
          {currentUser.role === 'administrator' && (
            <button
              onClick={handleResetDemoData}
              disabled={isResetting}
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-md transition"
              title="Reset synthetic database with clean demo seed"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Reset Data</span>
            </button>
          )}

          {/* Notifications Flyout */}
          <div className="relative">
            <button
              aria-label="View notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <span className="font-semibold text-sm">Notifications & Risk Flags</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-lg text-xs border ${
                          n.read
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold">{n.title}</span>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role & User Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition"
              aria-label="User profile and role menu"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-medium text-white leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-emerald-400 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-slate-800 dark:text-slate-200">
                <div className="pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <div className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Switch Demo Role</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Test role-based access control (RBAC)</p>
                </div>
                <div className="space-y-1">
                  {(
                    [
                      { role: 'administrator', name: 'Rajesh Sharma', label: 'Administrator (Full Access)' },
                      { role: 'project_manager', name: 'Priya Narayanan', label: 'Project Manager' },
                      { role: 'analyst', name: 'Arun Verma', label: 'Analyst (Read & Predict)' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.role}
                      onClick={() => {
                        onRoleChange(item.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                        currentUser.role === item.role
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-[10px] opacity-75">{item.name}</div>
                      </div>
                      {currentUser.role === item.role && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
