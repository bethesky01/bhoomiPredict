import React, { useState, useEffect } from 'react';
import { Project, Parcel, User, UserRole } from './types';
import { api } from './api/client';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ParcelsPage } from './pages/ParcelsPage';
import { PredictionStudioPage } from './pages/PredictionStudioPage';
import { GisMapPage } from './pages/GisMapPage';
import { MilestonesPage } from './pages/MilestonesPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ModelGovernancePage } from './pages/ModelGovernancePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ParcelDetailModal } from './components/ParcelDetailModal';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-admin',
    username: 'admin',
    name: 'Rajesh Sharma',
    email: 'r.sharma@nhai.gov.in',
    role: 'administrator',
    department: 'National Highway Infrastructure Authority',
  });
  const [activeParcel, setActiveParcel] = useState<Parcel | null>(null);
  const [openRecommendationsCount, setOpenRecommendationsCount] = useState<number>(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [selectedProjectId]);

  const loadAllData = async () => {
    try {
      const [projRes, parcelRes, dashRes, meRes, recRes] = await Promise.all([
        api.getProjects(),
        api.getParcels({ projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined, pageSize: 200 }),
        api.getDashboardAnalytics(selectedProjectId !== 'all' ? selectedProjectId : undefined),
        api.getCurrentUser().catch(() => null),
        api.getRecommendations({ status: 'open', projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined }),
      ]);

      setProjects(projRes.results);
      setParcels(parcelRes.items);
      setAnalytics(dashRes);
      if (meRes?.user) {
        setCurrentUser(meRes.user);
      }
      setOpenRecommendationsCount(recRes.count);
    } catch (err) {
      console.error('Failed to load application state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    try {
      const res = await api.login(role);
      setCurrentUser(res.user);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectParcelByCode = (code: string) => {
    const found = parcels.find((p) => p.code.toLowerCase() === code.toLowerCase());
    if (found) {
      setActiveParcel(found);
    } else {
      setCurrentTab('parcels');
    }
  };

  const handleParcelUpdated = (updated: Parcel) => {
    setParcels((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans">
      {/* 1. Persistent Synthetic Demo Banner */}
      <DemoBanner />

      {/* 2. Top Navigation Bar */}
      <Navbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => setSelectedProjectId(id)}
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onRefreshData={loadAllData}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* 3. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Collapsible Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            setMobileSidebarOpen(false);
          }}
          openRecommendationsCount={openRecommendationsCount}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardPage
                analytics={analytics}
                projects={projects}
                parcels={parcels}
                onSelectParcel={(parcel) => setActiveParcel(parcel)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'projects' && (
              <ProjectsPage
                projects={projects}
                parcels={parcels}
                currentUser={currentUser}
                onSelectProject={(id) => setSelectedProjectId(id)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onProjectCreated={loadAllData}
              />
            )}

            {currentTab === 'parcels' && (
              <ParcelsPage
                projects={projects}
                selectedProjectId={selectedProjectId}
                currentUser={currentUser}
                onSelectParcel={(parcel) => setActiveParcel(parcel)}
              />
            )}

            {currentTab === 'predictions' && (
              <PredictionStudioPage
                parcels={parcels}
                projects={projects}
                onSelectParcel={(parcel) => setActiveParcel(parcel)}
              />
            )}

            {currentTab === 'map' && (
              <GisMapPage
                parcels={parcels}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectParcel={(parcel) => setActiveParcel(parcel)}
              />
            )}

            {currentTab === 'milestones' && (
              <MilestonesPage
                projects={projects}
                selectedProjectId={selectedProjectId}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'recommendations' && (
              <RecommendationsPage
                projects={projects}
                selectedProjectId={selectedProjectId}
                currentUser={currentUser}
                onSelectParcelByCode={handleSelectParcelByCode}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsPage
                projects={projects}
                selectedProjectId={selectedProjectId}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'governance' && (
              <ModelGovernancePage currentUser={currentUser} />
            )}

            {currentTab === 'audit' && (
              <AuditLogsPage
                currentUser={currentUser}
                onRefreshAll={loadAllData}
              />
            )}
          </div>
        </main>
      </div>

      {/* 4. Parcel Detail & Inference Inspection Drawer/Modal */}
      {activeParcel && (
        <ParcelDetailModal
          parcel={activeParcel}
          onClose={() => setActiveParcel(null)}
          currentUser={currentUser}
          onParcelUpdated={handleParcelUpdated}
        />
      )}
    </div>
  );
}

export default App;
