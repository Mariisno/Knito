import { useMemo } from 'react';
import type { KnittingProject, Yarn } from '../types/knitting';

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  paused: number;
  planned: number;
  avgProgress: number;
  totalTime: number;
  totalYarns: number;
  completionRate: number;
  projectsThisYear: number;
  avgTimePerProject: number;
  categories: [string, number][];
}

export function useProjectStats(
  projects: KnittingProject[],
  standaloneYarns: Yarn[] = [],
): ProjectStats {
  return useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'Aktiv').length;
    const completed = projects.filter(p => p.status === 'Fullført').length;
    const paused = projects.filter(p => p.status === 'På vent').length;
    const planned = projects.filter(p => p.status === 'Planlagt').length;

    const avgProgress = total > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / total)
      : 0;

    const totalTime = projects.reduce((sum, p) => sum + (p.timeSpentMinutes || 0), 0);
    const totalYarns = projects.reduce((sum, p) => sum + p.yarns.length, 0) + standaloneYarns.length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const thisYear = new Date().getFullYear();
    const projectsThisYear = projects.filter(p =>
      new Date(p.createdAt).getFullYear() === thisYear
    ).length;

    const completedProjects = projects.filter(p => p.status === 'Fullført');
    const avgTimePerProject = completedProjects.length > 0
      ? Math.round(completedProjects.reduce((sum, p) => sum + (p.timeSpentMinutes || 0), 0) / completedProjects.length)
      : 0;

    const categoryMap = new Map<string, number>();
    projects.forEach(p => {
      if (p.category) {
        categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
      }
    });
    const categories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);

    return {
      total, active, completed, paused, planned,
      avgProgress, totalTime, totalYarns,
      completionRate, projectsThisYear, avgTimePerProject, categories,
    };
  }, [projects, standaloneYarns]);
}
