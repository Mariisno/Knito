import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { AddProjectDialog } from './components/AddProjectDialog';
import { AuthForm } from './components/AuthForm';
import { YarnInventory } from './components/YarnInventory';
import { NeedleInventory } from './components/NeedleInventory';
import { StatisticsView } from './components/StatisticsView';
import { PWAMeta } from './components/PWAMeta';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { DesignVersionProvider, useDesignVersion } from './contexts/DesignVersionContext';
import { DiagnosticTest } from './components/DiagnosticTest';
import { PasswordResetAdmin } from './components/PasswordResetAdmin';
import { PasswordResetFlow } from './components/PasswordResetFlow';
import { BottomTabBar } from './components/BottomTabBar';
import { PrivacyDialog } from './components/PrivacyDialog';
import { FeedbackDialog } from './components/FeedbackDialog';

import { Loader2 } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProjects } from './hooks/useProjects';
import type { KnittingProject, NeedleInventoryItem, Yarn } from './types/knitting';
import { exportAllDataAsJSON } from './utils/export';

// DIAGNOSTIC MODE - Set to false to return to normal app
const SHOW_DIAGNOSTIC = false;

function ProjectDetailRoute({
  projects,
  onUpdate,
  onDelete,
  accessToken,
  needleInventory,
  standaloneYarns,
  onUpdateStandaloneYarns,
}: {
  projects: KnittingProject[];
  onUpdate: (project: KnittingProject) => void;
  onDelete: (projectId: string) => void;
  accessToken: string;
  needleInventory: NeedleInventoryItem[];
  standaloneYarns: Yarn[];
  onUpdateStandaloneYarns: (yarns: Yarn[]) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === id);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  return (
    <ProjectDetail
      key={project.id}
      project={project}
      projects={projects}
      onBack={() => navigate('/')}
      onUpdate={onUpdate}
      onDelete={(projectId) => {
        onDelete(projectId);
        navigate('/');
      }}
      accessToken={accessToken}
      needleInventory={needleInventory}
      standaloneYarns={standaloneYarns}
      onUpdateStandaloneYarns={onUpdateStandaloneYarns}
    />
  );
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { version: designVersion, toggleVersion: toggleDesignVersion } = useDesignVersion();
  const { user, accessToken, loading: authLoading, signOut, supabase } = useAuth();
  const navigate = useNavigate();

  const {
    projects, standaloneYarns, needleInventory, loading: dataLoading,
    addProject, updateProject, deleteProject, changeProgress,
    updateStandaloneYarns, updateStandaloneYarn, deleteStandaloneYarn,
    updateNeedleInventory,
  } = useProjects(accessToken);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('prosjekter');

  const loading = authLoading || dataLoading;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') setIsAddDialogOpen(true);
      if (e.key === 'Escape' && isAddDialogOpen) setIsAddDialogOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddDialogOpen]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Du er nå logget ut');
  };

  const handleAddProject = async (project: Omit<KnittingProject, 'id' | 'createdAt'>) => {
    return await addProject(project);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" style={{ width: 48, height: 48, color: 'var(--primary)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--muted-fg)', fontFamily: 'var(--font-ui)' }}>Laster...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        width: '100%', maxWidth: 'var(--shell-max-w)', minHeight: '100vh',
        background: 'var(--bg)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 24px 48px -12px rgba(45,37,32,0.15)',
      }}>
        <Toaster />
        <AuthForm />
      </div>
    );
  }

  const dashboard = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--font-ui)' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'prosjekter' && (
          <ErrorBoundary>
            <ProjectList
              projects={projects}
              onSelectProject={(id) => navigate(`/projects/${id}`)}
              onProgressChange={changeProgress}
              onNewProject={() => setIsAddDialogOpen(true)}
              onSignOut={handleSignOut}
              onToggleTheme={toggleTheme}
              theme={theme}
              onExport={() => {
                exportAllDataAsJSON(projects, standaloneYarns, needleInventory);
                toast.success('Sikkerhetskopi lastet ned');
              }}
              onPrivacy={() => setIsPrivacyOpen(true)}
              onFeedback={() => setIsFeedbackOpen(true)}
              designVersion={designVersion}
              onToggleDesignVersion={toggleDesignVersion}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'garnlager' && (
          <ErrorBoundary>
            <YarnInventory
              projects={projects}
              standaloneYarns={standaloneYarns}
              onUpdateStandaloneYarns={updateStandaloneYarns}
              onUpdateStandaloneYarn={updateStandaloneYarn}
              onDeleteStandaloneYarn={deleteStandaloneYarn}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'verktoy' && (
          <ErrorBoundary>
            <NeedleInventory
              projects={projects}
              needleInventory={needleInventory}
              onUpdateNeedleInventory={updateNeedleInventory}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'statistikk' && (
          <ErrorBoundary>
            <StatisticsView projects={projects} />
          </ErrorBoundary>
        )}
      </div>

      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <AddProjectDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddProject={handleAddProject}
        onUpdateProject={updateProject}
        accessToken={accessToken!}
        standaloneYarns={standaloneYarns}
        needleInventory={needleInventory}
        onUpdateStandaloneYarns={updateStandaloneYarns}
        onUpdateNeedleInventory={updateNeedleInventory}
      />

      <PrivacyDialog
        open={isPrivacyOpen}
        onOpenChange={setIsPrivacyOpen}
        projects={projects}
        standaloneYarns={standaloneYarns}
        needleInventory={needleInventory}
        accessToken={accessToken!}
        onAccountDeleted={handleSignOut}
      />

      <FeedbackDialog
        open={isFeedbackOpen}
        onOpenChange={setIsFeedbackOpen}
        accessToken={accessToken}
      />
    </div>
  );

  return (
    <div style={{
      width: '100%',
      maxWidth: 'var(--shell-max-w)',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg)',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 24px 48px -12px rgba(45,37,32,0.15)',
    }}>
      <PWAMeta />
      <Toaster />

      <ErrorBoundary>
        <Routes>
          <Route index element={dashboard} />
          <Route
            path="projects/:id"
            element={
              <ErrorBoundary>
                <ProjectDetailRoute
                  projects={projects}
                  onUpdate={updateProject}
                  onDelete={deleteProject}
                  accessToken={accessToken!}
                  needleInventory={needleInventory}
                  standaloneYarns={standaloneYarns}
                  onUpdateStandaloneYarns={updateStandaloneYarns}
                />
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const { supabase } = useAuth();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordReset(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const isResetFlow = showPasswordReset ||
                      window.location.hash.includes('reset-password') ||
                      window.location.hash.includes('type=recovery');

  if (isResetFlow) {
    return (
      <ThemeProvider>
        <DesignVersionProvider>
          <Toaster />
          <PasswordResetFlow supabase={supabase} />
        </DesignVersionProvider>
      </ThemeProvider>
    );
  }

  if (window.location.hash === '#admin-reset') {
    return (
      <ThemeProvider>
        <DesignVersionProvider>
          <Toaster />
          <PasswordResetAdmin />
        </DesignVersionProvider>
      </ThemeProvider>
    );
  }

  if (SHOW_DIAGNOSTIC) {
    return (
      <ThemeProvider>
        <DesignVersionProvider>
          <DiagnosticTest />
        </DesignVersionProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <DesignVersionProvider>
        <AppContent />
      </DesignVersionProvider>
    </ThemeProvider>
  );
}
