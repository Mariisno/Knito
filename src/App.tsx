import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
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
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Plus, Loader2, LogOut, Activity, CheckCircle2, Clock, PauseCircle, Moon, Sun, Package, Download } from 'lucide-react';
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
      onBack={(tab?: string) => navigate(tab ? `/?tab=${tab}` : '/')}
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

  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'prosjekter');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['prosjekter', 'garnlager', 'verktoy', 'statistikk'].includes(tab)) {
      setActiveTab(tab);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
        <AuthForm onSignIn={async () => {}} onSignUp={async () => {}} supabase={supabase} />
      </>
    );
  }

  const dashboard = (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
        <div>
          <h1 className="text-foreground mb-2">Mine Strikkeprosjekter</h1>
          <p className="text-muted-foreground">Velkommen, {user.name || user.email}!</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              exportAllDataAsJSON(projects, standaloneYarns, needleInventory);
              toast.success('Sikkerhetskopi lastet ned');
            }}
            variant="outline"
            size="icon"
            className="border-border"
            title="Last ned sikkerhetskopi"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={toggleTheme} variant="outline" size="icon" className="border-border" title="Bytt tema">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button onClick={handleSignOut} variant="outline" className="border-border">
            <LogOut className="mr-2 h-4 w-4" />
            Logg ut
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all" title="Nytt prosjekt (N)">
            <Plus className="mr-2 h-5 w-5" />
            Nytt prosjekt
          </Button>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/50">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />Aktive</CardTitle></CardHeader>
            <CardContent><p className="text-amber-900 dark:text-amber-100">{stats.active} prosjekt{stats.active !== 1 ? 'er' : ''}</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200/50 dark:border-emerald-800/50">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />Fullført</CardTitle></CardHeader>
            <CardContent><p className="text-emerald-900 dark:text-emerald-100">{stats.completed} prosjekt{stats.completed !== 1 ? 'er' : ''}</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><PauseCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />På vent</CardTitle></CardHeader>
            <CardContent><p className="text-blue-900 dark:text-blue-100">{stats.paused} prosjekt{stats.paused !== 1 ? 'er' : ''}</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200/50 dark:border-rose-800/50">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-rose-600 dark:text-rose-400" />Tid brukt</CardTitle></CardHeader>
            <CardContent><p className="text-rose-900 dark:text-rose-100">{stats.totalTime > 0 ? `${Math.floor(stats.totalTime / 60)}t ${stats.totalTime % 60}m` : 'Ikke registrert'}</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200/50 dark:border-purple-800/50">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />Garn totalt</CardTitle></CardHeader>
            <CardContent><p className="text-purple-900 dark:text-purple-100">{stats.totalYarns} garn</p></CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="prosjekter">Prosjekter</TabsTrigger>
          <TabsTrigger value="garnlager">Garnlager</TabsTrigger>
          <TabsTrigger value="verktoy">Verktøy</TabsTrigger>
          <TabsTrigger value="statistikk">Statistikk</TabsTrigger>
        </TabsList>
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
      </Tabs>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground">
          💡 Tips: Trykk <kbd className="px-2 py-1 bg-muted rounded border border-border mx-1">N</kbd> for nytt prosjekt,
          <kbd className="px-2 py-1 bg-muted rounded border border-border mx-1">Esc</kbd> for å gå tilbake
        </p>
      </div>

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
