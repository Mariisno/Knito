import { useMemo } from 'react';
import type { KnittingProject, Yarn } from '../types/knitting';

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  paused: number;
  planned: number;
  archived: number;
  avgProgress: number;
  totalTime: number;
  totalYarns: number;
  completionRate: number;
  projectsThisYear: number;
  avgTimePerProject: number;
  categories: [string, number][];
  totalCost: number;
  avgCostPerProject: number;
  avgDurationDays: number;
  longestProject: { name: string; days: number } | null;
  mostUsedYarnWeight: string | null;
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
    const archived = projects.filter(p => p.status === 'Arkivert').length;

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

    // Cost tracking
    const allYarns = [...projects.flatMap(p => p.yarns), ...standaloneYarns];
    const totalCost = allYarns.reduce((sum, y) => sum + (y.price || 0), 0);
    const projectsWithCost = projects.filter(p => p.yarns.some(y => y.price && y.price > 0));
    const avgCostPerProject = projectsWithCost.length > 0
      ? Math.round(projectsWithCost.reduce((sum, p) => sum + p.yarns.reduce((s, y) => s + (y.price || 0), 0), 0) / projectsWithCost.length)
      : 0;

    // Duration analysis for completed projects with start+end dates
    const completedWithDates = completedProjects.filter(p => p.startDate && p.endDate);
    const durations = completedWithDates.map(p => {
      const days = Math.ceil((new Date(p.endDate!).getTime() - new Date(p.startDate!).getTime()) / (1000 * 60 * 60 * 24));
      return { name: p.name, days: Math.max(0, days) };
    });
    const avgDurationDays = durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d.days, 0) / durations.length)
      : 0;
    const longestProject = durations.length > 0
      ? durations.reduce((max, d) => d.days > max.days ? d : max, durations[0])
      : null;

    // Most used yarn weight
    const weightMap = new Map<string, number>();
    allYarns.forEach(y => {
      if (y.weight) {
        weightMap.set(y.weight, (weightMap.get(y.weight) || 0) + 1);
      }
    });
    const mostUsedYarnWeight = weightMap.size > 0
      ? Array.from(weightMap.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    return {
      total, active, completed, paused, planned, archived,
      avgProgress, totalTime, totalYarns,
      completionRate, projectsThisYear, avgTimePerProject, categories,
      totalCost, avgCostPerProject, avgDurationDays, longestProject, mostUsedYarnWeight,
    };
  }, [projects, standaloneYarns]);
}
