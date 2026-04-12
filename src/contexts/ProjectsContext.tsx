import { createContext, useContext, type ReactNode } from 'react';
import type { KnittingProject, Yarn, NeedleInventoryItem } from '../types/knitting';
import { useProjects } from '../hooks/useProjects';
import { useProjectStats, type ProjectStats } from '../hooks/useProjectStats';

interface ProjectsContextType {
  projects: KnittingProject[];
  standaloneYarns: Yarn[];
  needleInventory: NeedleInventoryItem[];
  loading: boolean;
  stats: ProjectStats;
  addProject: (project: Omit<KnittingProject, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (project: KnittingProject) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  changeProgress: (projectId: string, newProgress: number) => Promise<void>;
  updateStandaloneYarns: (yarns: Yarn[]) => Promise<void>;
  updateNeedleInventory: (needles: NeedleInventoryItem[]) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | null>(null);

export function ProjectsProvider({ accessToken, children }: { accessToken: string | null; children: ReactNode }) {
  const {
    projects, standaloneYarns, needleInventory, loading,
    addProject, updateProject, deleteProject, changeProgress,
    updateStandaloneYarns, updateNeedleInventory,
  } = useProjects(accessToken);

  const stats = useProjectStats(projects, standaloneYarns);

  return (
    <ProjectsContext.Provider value={{
      projects, standaloneYarns, needleInventory, loading, stats,
      addProject, updateProject, deleteProject, changeProgress,
      updateStandaloneYarns, updateNeedleInventory,
    }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjectsContext() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjectsContext must be used within ProjectsProvider');
  return ctx;
}
