import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import * as api from '../utils/api';
import type { KnittingProject, Yarn } from '../types/knitting';
import type { NeedleInventoryItem } from '../types/knitting';

export function useProjects(accessToken: string | null) {
  const [projects, setProjects] = useState<KnittingProject[]>([]);
  const [standaloneYarns, setStandaloneYarns] = useState<Yarn[]>([]);
  const [needleInventory, setNeedleInventory] = useState<NeedleInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accessToken) {
      loadAll();
    }
  }, [accessToken]);

  const loadAll = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const [projectsResult, yarnsResult, needlesResult] = await Promise.allSettled([
        api.getAllProjects(accessToken),
        api.getStandaloneYarns(accessToken),
        api.getNeedleInventory(accessToken),
      ]);

      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value);
      } else {
        console.error('Failed to load projects:', projectsResult.reason);
      }

      if (yarnsResult.status === 'fulfilled') {
        setStandaloneYarns(yarnsResult.value);
      } else {
        console.error('Failed to load yarns:', yarnsResult.reason);
      }

      if (needlesResult.status === 'fulfilled') {
        setNeedleInventory(needlesResult.value);
      } else {
        console.error('Failed to load needles:', needlesResult.reason);
      }

      const failures = [projectsResult, yarnsResult, needlesResult].filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        toast.error(`Kunne ikke laste ${failures.length === 3 ? 'data' : 'deler av data'}`);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (project: Omit<KnittingProject, 'id' | 'createdAt'>): Promise<KnittingProject | null> => {
    if (!accessToken) {
      toast.error('Du må være logget inn for å opprette prosjekter');
      return null;
    }

    const newProject: KnittingProject = {
      ...project,
      needles: project.needles || [],
      status: project.status || 'Planlagt',
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    setProjects(prev => [...prev, newProject]);

    try {
      const savedProject = await api.createProject(newProject, accessToken);
      setProjects(prev => prev.map(p => p.id === newProject.id ? savedProject : p));
      return savedProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      setProjects(prev => prev.filter(p => p.id !== newProject.id));
      toast.error('Kunne ikke lagre prosjekt. Prøv igjen.');
      return null;
    }
  };

  const updateProject = async (updatedProject: KnittingProject) => {
    if (!accessToken) return;

    const previousProject = projects.find(p => p.id === updatedProject.id);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

    try {
      await api.updateProject(updatedProject.id, updatedProject, accessToken);
    } catch (error) {
      console.error('Failed to update project:', error);
      if (previousProject) {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? previousProject : p));
      }
      toast.error('Kunne ikke lagre endringer. Prøv igjen.');
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!accessToken) return;

    const previousProject = projects.find(p => p.id === projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast.success('Prosjekt slettet');

    try {
      await api.deleteProject(projectId, accessToken);
    } catch (error) {
      console.error('Failed to delete project:', error);
      if (previousProject) {
        setProjects(prev => [...prev, previousProject]);
      }
      toast.error('Kunne ikke slette prosjekt. Prøv igjen.');
    }
  };

  const changeProgress = (projectId: string, newProgress: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updated = { ...project, progress: newProgress };
      if (newProgress === 100 && project.status !== 'Fullført') {
        updated.status = 'Fullført';
        updated.endDate = new Date();
        toast.success('Gratulerer! Prosjektet er fullført! 🎉');
      }
      updateProject(updated);
    }
  };

  const updateStandaloneYarns = async (yarns: Yarn[]) => {
    if (!accessToken) return;

    const previousYarns = standaloneYarns;
    setStandaloneYarns(yarns);

    try {
      await api.updateStandaloneYarns(yarns, accessToken);
    } catch (error) {
      console.error('Failed to update standalone yarns:', error);
      setStandaloneYarns(previousYarns);
      toast.error('Kunne ikke lagre restegarn. Prøv igjen.');
    }
  };

  // Fields that are shared between an inventory yarn and the project copies that link to it.
  // `id`, `standaloneYarnId`, `amount` (project-specific) and `quantity`/`price` (inventory-only)
  // are intentionally excluded.
  const SHARED_YARN_FIELDS = ['name', 'brand', 'color', 'weight', 'fiberContent', 'yardage', 'dyeLot', 'imageUrl', 'notes'] as const;

  const syncProjectYarn = (projectYarn: Yarn, source: Yarn): Yarn => {
    const synced: Yarn = {
      id: projectYarn.id,
      standaloneYarnId: projectYarn.standaloneYarnId,
      name: source.name,
      amount: projectYarn.amount,
    };
    for (const field of SHARED_YARN_FIELDS) {
      if (field === 'name') continue;
      const value = source[field];
      if (value !== undefined && value !== '') {
        (synced as any)[field] = value;
      }
    }
    return synced;
  };

  const updateStandaloneYarn = async (updated: Yarn) => {
    if (!accessToken) return;

    const previousYarns = standaloneYarns;
    const previousProjects = projects;

    const newYarns = standaloneYarns.map(y => y.id === updated.id ? updated : y);

    const projectsToPersist: KnittingProject[] = [];
    const newProjects = projects.map(project => {
      const hasLink = project.yarns.some(y => y.standaloneYarnId === updated.id);
      if (!hasLink) return project;
      const updatedProject = {
        ...project,
        yarns: project.yarns.map(y =>
          y.standaloneYarnId === updated.id ? syncProjectYarn(y, updated) : y
        ),
      };
      projectsToPersist.push(updatedProject);
      return updatedProject;
    });

    setStandaloneYarns(newYarns);
    setProjects(newProjects);

    try {
      await Promise.all([
        api.updateStandaloneYarns(newYarns, accessToken),
        ...projectsToPersist.map(p => api.updateProject(p.id, p, accessToken)),
      ]);
    } catch (error) {
      console.error('Failed to update standalone yarn:', error);
      setStandaloneYarns(previousYarns);
      setProjects(previousProjects);
      toast.error('Kunne ikke lagre garn. Prøv igjen.');
    }
  };

  const deleteStandaloneYarn = async (id: string) => {
    if (!accessToken) return;

    const previousYarns = standaloneYarns;
    const previousProjects = projects;

    const newYarns = standaloneYarns.filter(y => y.id !== id);

    // Keep prosjekt-kopier intakt, men fjern lenke slik at vi ikke har dødt referanse.
    const projectsToPersist: KnittingProject[] = [];
    const newProjects = projects.map(project => {
      const hasLink = project.yarns.some(y => y.standaloneYarnId === id);
      if (!hasLink) return project;
      const updatedProject = {
        ...project,
        yarns: project.yarns.map(y => {
          if (y.standaloneYarnId !== id) return y;
          const { standaloneYarnId: _, ...rest } = y;
          return rest;
        }),
      };
      projectsToPersist.push(updatedProject);
      return updatedProject;
    });

    setStandaloneYarns(newYarns);
    setProjects(newProjects);

    try {
      await Promise.all([
        api.updateStandaloneYarns(newYarns, accessToken),
        ...projectsToPersist.map(p => api.updateProject(p.id, p, accessToken)),
      ]);
    } catch (error) {
      console.error('Failed to delete standalone yarn:', error);
      setStandaloneYarns(previousYarns);
      setProjects(previousProjects);
      toast.error('Kunne ikke slette garn. Prøv igjen.');
    }
  };

  const updateNeedleInventory = async (needles: NeedleInventoryItem[]) => {
    if (!accessToken) return;

    const previousNeedles = needleInventory;
    setNeedleInventory(needles);

    try {
      await api.updateNeedleInventory(needles, accessToken);
    } catch (error) {
      console.error('Failed to update needle inventory:', error);
      setNeedleInventory(previousNeedles);
      toast.error('Kunne ikke lagre verktøy. Prøv igjen.');
    }
  };

  return {
    projects,
    standaloneYarns,
    needleInventory,
    loading,
    addProject,
    updateProject,
    deleteProject,
    changeProgress,
    updateStandaloneYarns,
    updateStandaloneYarn,
    deleteStandaloneYarn,
    updateNeedleInventory,
  };
}
