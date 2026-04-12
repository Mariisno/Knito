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
import { DiagnosticTest } from './components/DiagnosticTest';
import { PasswordResetAdmin } from './components/PasswordResetAdmin';
import { PasswordResetFlow } from './components/PasswordResetFlow';
import { Button } from './components/ui/button';
// Card imports kept for other components

import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Plus, Loader2, LogOut, Moon, Sun, Download, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProjects } from './hooks/useProjects';
import { useProjectStats } from './hooks/useProjectStats';
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
}: {
  projects: KnittingProject[];
  onUpdate: (project: KnittingProject) => void;
  onDelete: (projectId: string) => void;
  accessToken: string;
  needleInventory: NeedleInventoryItem[];
  standaloneYarns: Yarn[];
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
      onBack={() => navigate('/')}
      onUpdate={onUpdate}
      onDelete={(projectId) => {
        onDelete(projectId);
        navigate('/');
      }}
      accessToken={accessToken}
      needleInventory={needleInventory}
      standaloneYarns={standaloneYarns}
    />
  );
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { user, accessToken, loading: authLoading, signOut, supabase } = useAuth();
  const navigate = useNavigate();

  const {
    projects, standaloneYarns, needleInventory, loading: dataLoading,
    addProject, updateProject, deleteProject, changeProgress,
    updateStandaloneYarns, updateNeedleInventory,
  } = useProjects(accessToken);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('prosjekter');

  const stats = useProjectStats(projects, standaloneYarns);
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
    setIsAddDialogOpen(false);
    await addProject(project);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster />
        <AuthForm />
      </>
    );
  }

  const dashboard = (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-foreground text-xl">Knito</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" title="Nytt prosjekt (N)">
            <Plus className="mr-2 h-4 w-4" />
            Nytt prosjekt
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-border h-10 w-10 p-0" title="Innstillinger">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                {theme === 'light' ? 'Mørkt tema' : 'Lyst tema'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                exportAllDataAsJSON(projects, standaloneYarns, needleInventory);
                toast.success('Sikkerhetskopi lastet ned');
              }}>
                <Download className="mr-2 h-4 w-4" />
                Last ned sikkerhetskopi
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logg ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border w-full">
          <TabsTrigger value="prosjekter" className="flex-1">Prosjekter</TabsTrigger>
          <TabsTrigger value="garnlager" className="flex-1">Garnlager</TabsTrigger>
          <TabsTrigger value="verktoy" className="flex-1">Verktøy</TabsTrigger>
          <TabsTrigger value="statistikk" className="flex-1">Statistikk</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="prosjekter">
            <ErrorBoundary>
              <ProjectList projects={projects} onSelectProject={(id) => navigate(`/projects/${id}`)} onProgressChange={changeProgress} />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="garnlager">
            <ErrorBoundary>
              <YarnInventory projects={projects} standaloneYarns={standaloneYarns} onUpdateStandaloneYarns={updateStandaloneYarns} />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="verktoy">
            <ErrorBoundary>
              <NeedleInventory projects={projects} needleInventory={needleInventory} onUpdateNeedleInventory={updateNeedleInventory} />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="statistikk">
            <ErrorBoundary>
              <StatisticsView projects={projects} />
            </ErrorBoundary>
          </TabsContent>
        </div>
      </Tabs>

      <AddProjectDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddProject={handleAddProject} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
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
                />
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>

      <footer className="text-center py-4 text-sm text-muted-foreground">
        v1.0.0 - Oppdatert: 11. april 2026
      </footer>
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
                      window.location.hash.includes('type=recovery') ||
                      window.location.hash.includes('access_token');

  if (isResetFlow) {
    return (
      <ThemeProvider>
        <Toaster />
        <PasswordResetFlow supabase={supabase} />
      </ThemeProvider>
    );
  }

  if (window.location.hash === '#admin-reset') {
    return (
      <ThemeProvider>
        <Toaster />
        <PasswordResetAdmin />
      </ThemeProvider>
    );
  }

  if (SHOW_DIAGNOSTIC) {
    return (
      <ThemeProvider>
        <DiagnosticTest />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
