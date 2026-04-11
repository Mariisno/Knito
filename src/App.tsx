import { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { AddProjectDialog } from './components/AddProjectDialog';
import { AuthForm } from './components/AuthForm';
import { YarnInventory } from './components/YarnInventory';
import { StatisticsView } from './components/StatisticsView';
import { PWAMeta } from './components/PWAMeta';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { DiagnosticTest } from './components/DiagnosticTest';
import { PasswordResetAdmin } from './components/PasswordResetAdmin';
import { PasswordResetFlow } from './components/PasswordResetFlow';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Plus, Loader2, LogOut, Activity, CheckCircle2, Clock, PauseCircle, Moon, Sun, Package } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import * as api from './utils/api';
import { getSupabaseClient } from './utils/supabase/client';
import { projectId } from './utils/supabase/info.tsx';
import type { KnittingProject, Yarn } from './types/knitting';

const supabase = getSupabaseClient();

// DIAGNOSTIC MODE - Set to false to return to normal app
const SHOW_DIAGNOSTIC = false;

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const [projects, setProjects] = useState<KnittingProject[]>([]);
  const [standaloneYarns, setStandaloneYarns] = useState<Yarn[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('prosjekter');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'Aktiv').length;
    const completed = projects.filter(p => p.status === 'Fullført').length;
    const paused = projects.filter(p => p.status === 'På vent').length;
    const avgProgress = total > 0 
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / total)
      : 0;
    const totalTime = projects.reduce((sum, p) => sum + (p.timeSpentMinutes || 0), 0);
    const totalYarns = projects.reduce((sum, p) => sum + p.yarns.length, 0) + standaloneYarns.length;
    
    return { total, active, completed, paused, avgProgress, totalTime, totalYarns };
  }, [projects, standaloneYarns]);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Load projects when user changes
  useEffect(() => {
    if (user && accessToken) {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, [user, accessToken]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // N = New project
      if (e.key === 'n' || e.key === 'N') {
        if (!selectedProjectId) {
          setIsAddDialogOpen(true);
        }
      }

      // Esc = Back/Close
      if (e.key === 'Escape') {
        if (isAddDialogOpen) {
          setIsAddDialogOpen(false);
        } else if (selectedProjectId) {
          setSelectedProjectId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProjectId, isAddDialogOpen]);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user && session.access_token) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
        });
        setAccessToken(session.access_token);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      console.log('Loading projects with access token:', accessToken?.substring(0, 20) + '...');
      
      const [projectsData, yarnsData] = await Promise.all([
        api.getAllProjects(accessToken),
        api.getStandaloneYarns(accessToken),
      ]);
      setProjects(projectsData);
      setStandaloneYarns(yarnsData);
      console.log('Successfully loaded projects and yarns');
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      console.log('Starting sign in process...');
      console.log('Supabase URL:', `https://${projectId}.supabase.co`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error from Supabase:', error);
        throw error;
      }

      if (data.session?.user && data.session.access_token) {
        console.log('Sign in successful!');
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name,
        });
        setAccessToken(data.session.access_token);
      } else {
        console.error('No session or access token returned');
        throw new Error('Ingen session returnert');
      }
    } catch (error) {
      console.error('Error in handleSignIn:', error);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Starting sign up process...');
      console.log('API Base URL:', `https://${projectId}.supabase.co/functions/v1/make-server-b06c9f7a`);
      
      await api.signup(email, password, name);
      console.log('Sign up successful, now signing in...');
      await handleSignIn(email, password);
    } catch (error) {
      console.error('Error in handleSignUp:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setProjects([]);
    setStandaloneYarns([]);
    toast.success('Du er nå logget ut');
  };

  const handleUpdateStandaloneYarns = async (yarns: Yarn[]) => {
    if (!accessToken) return;

    // Optimistic update
    const previousYarns = standaloneYarns;
    setStandaloneYarns(yarns);

    try {
      await api.updateStandaloneYarns(yarns, accessToken);
    } catch (error) {
      console.error('Failed to update standalone yarns:', error);
      // Rollback on error
      setStandaloneYarns(previousYarns);
      toast.error('Kunne ikke lagre restegarn. Prøv igjen.');
    }
  };

  const handleAddProject = async (project: Omit<KnittingProject, 'id' | 'createdAt'>) => {
    if (!accessToken) {
      console.error('No access token available');
      toast.error('Du må være logget inn for å opprette prosjekter');
      return;
    }

    const newProject: KnittingProject = {
      ...project,
      needles: project.needles || [],
      status: project.status || 'Planlagt',
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    console.log('handleAddProject - Creating new project:', newProject);
    
    // Optimistic update
    setProjects([...projects, newProject]);
    setIsAddDialogOpen(false);
    toast.success('Prosjekt opprettet');
    
    try {
      console.log('handleAddProject - Calling api.createProject...');
      const savedProject = await api.createProject(newProject, accessToken);
      console.log('handleAddProject - Project saved successfully:', savedProject);
      
      // Update with the saved version (in case backend modified anything)
      setProjects(prev => prev.map(p => p.id === newProject.id ? savedProject : p));
    } catch (error) {
      console.error('handleAddProject - Failed to create project:', error);
      // Rollback on error
      setProjects(projects);
      toast.error('Kunne ikke lagre prosjekt. Prøv igjen.');
    }
  };

  const handleUpdateProject = async (updatedProject: KnittingProject) => {
    if (!accessToken) return;

    // Optimistic update
    const previousProjects = projects;
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));

    try {
      await api.updateProject(updatedProject.id, updatedProject, accessToken);
    } catch (error) {
      console.error('Failed to update project:', error);
      // Rollback on error
      setProjects(previousProjects);
      toast.error('Kunne ikke lagre endringer. Prøv igjen.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!accessToken) return;

    // Optimistic update
    const previousProjects = projects;
    setProjects(projects.filter(p => p.id !== projectId));
    setSelectedProjectId(null);
    toast.success('Prosjekt slettet');

    try {
      await api.deleteProject(projectId, accessToken);
    } catch (error) {
      console.error('Failed to delete project:', error);
      // Rollback on error
      setProjects(previousProjects);
      toast.error('Kunne ikke slette prosjekt. Prøv igjen.');
    }
  };

  const handleProgressChange = (projectId: string, newProgress: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updated = { ...project, progress: newProgress };
      if (newProgress === 100 && project.status !== 'Fullført') {
        updated.status = 'Fullført';
        updated.endDate = new Date();
        toast.success('Gratulerer! Prosjektet er fullført! 🎉');
      }
      handleUpdateProject(updated);
    }
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
        <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} supabase={supabase} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PWAMeta />
      <Toaster />
      
      {!selectedProject ? (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <div>
              <h1 className="text-foreground mb-2">Mine Strikkeprosjekter</h1>
              <p className="text-muted-foreground">
                Velkommen, {user.name || user.email}!
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={toggleTheme} 
                variant="outline"
                size="icon"
                className="border-border"
                title="Bytt tema"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button 
                onClick={handleSignOut} 
                variant="outline"
                className="border-border"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logg ut
              </Button>
              <Button 
                onClick={() => setIsAddDialogOpen(true)} 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nytt prosjekt
              </Button>
            </div>
          </div>

          {/* Statistics Cards - Only show if user has projects */}
          {projects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Aktive
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-900 dark:text-amber-100">{stats.active} prosjekt{stats.active !== 1 ? 'er' : ''}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200/50 dark:border-emerald-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Fullført
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-emerald-900 dark:text-emerald-100">{stats.completed} prosjekt{stats.completed !== 1 ? 'er' : ''}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <PauseCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    På vent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-900 dark:text-blue-100">{stats.paused} prosjekt{stats.paused !== 1 ? 'er' : ''}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200/50 dark:border-rose-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    Tid brukt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-rose-900 dark:text-rose-100">
                    {stats.totalTime > 0 
                      ? `${Math.floor(stats.totalTime / 60)}t ${stats.totalTime % 60}m`
                      : 'Ikke registrert'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200/50 dark:border-purple-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Garn totalt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-900 dark:text-purple-100">{stats.totalYarns} garn</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="prosjekter">Prosjekter</TabsTrigger>
              <TabsTrigger value="garnlager">Garnlager</TabsTrigger>
              <TabsTrigger value="statistikk">Statistikk</TabsTrigger>
            </TabsList>

            <TabsContent value="prosjekter">
              <ProjectList 
                projects={projects}
                onSelectProject={setSelectedProjectId}
                onProgressChange={handleProgressChange}
              />
            </TabsContent>

            <TabsContent value="garnlager">
              <YarnInventory 
                projects={projects} 
                standaloneYarns={standaloneYarns}
                onUpdateStandaloneYarns={handleUpdateStandaloneYarns}
              />
            </TabsContent>

            <TabsContent value="statistikk">
              <StatisticsView projects={projects} />
            </TabsContent>
          </Tabs>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              💡 Tips: Trykk <kbd className="px-2 py-1 bg-muted rounded border border-border mx-1">N</kbd> for nytt prosjekt, 
              <kbd className="px-2 py-1 bg-muted rounded border border-border mx-1">Esc</kbd> for å gå tilbake
            </p>
          </div>

          <AddProjectDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAddProject={handleAddProject}
          />
        </div>
      ) : (
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProjectId(null)}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
          accessToken={accessToken!}
        />
      )}
    </div>
  );
}

export default function App() {
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Main App Auth Event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordReset(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check if we should show password reset based on URL hash or state
  const isResetFlow = showPasswordReset || 
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