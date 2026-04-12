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
    console.log('[DEBUG] useProjects effect fired, accessToken:', accessToken ? 'SET (' + accessToken.substring(0, 20) + '...)' : 'NULL');
    if (accessToken) {
      loadAll();
    }
  }, [accessToken]);

  const loadAll = async () => {
    console.log('[DEBUG] loadAll called, accessToken:', accessToken ? 'SET' : 'NULL');
    if (!accessToken) return;

    try {
      setLoading(true);
      console.log('[DEBUG] About to fetch projects, yarns, needles...');
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

  const addProject = async (project: Omit<KnittingProject, 'id' | 'createdAt'>) => {
    if (!accessToken) {
      toast.error('Du må være logget inn for å opprette prosjekter');
      return;
    }

    const newProject: KnittingProject = {
      ...project,
      needles: project.needles || [],
      status: project.status || 'Planlagt',
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    const previousProjects = projects;
    setProjects(prev => [...prev, newProject]);
    toast.success('Prosjekt opprettet');

    try {
      const savedProject = await api.createProject(newProject, accessToken);
      setProjects(prev => prev.map(p => p.id === newProject.id ? savedProject : p));
    } catch (error) {
      console.error('Failed to create project:', error);
      setProjects(previousProjects);
      toast.error('Kunne ikke lagre prosjekt. Prøv igjen.');
    }
  };

  const updateProject = async (updatedProject: KnittingProject) => {
    if (!accessToken) return;

    const previousProjects = projects;
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

    try {
      await api.updateProject(updatedProject.id, updatedProject, accessToken);
    } catch (error) {
      console.error('Failed to update project:', error);
      setProjects(previousProjects);
      toast.error('Kunne ikke lagre endringer. Prøv igjen.');
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!accessToken) return;

    const previousProjects = projects;
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast.success('Prosjekt slettet');

    try {
      await api.deleteProject(projectId, accessToken);
    } catch (error) {
      console.error('Failed to delete project:', error);
      setProjects(previousProjects);
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
    updateNeedleInventory,
  };
}
