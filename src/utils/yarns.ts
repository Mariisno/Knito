import type { KnittingProject, Yarn } from '../types/knitting';
import { isProjectActive } from './needles';

export interface YarnAvailability {
  totalQuantity: number;
  takenCount: number;
  availableCount: number;
  takenBy: { projectId: string; projectName: string; quantity: number }[];
}

export function getAllYarnAvailability(
  standaloneYarns: Yarn[],
  projects: KnittingProject[],
): Map<string, YarnAvailability> {
  const map = new Map<string, YarnAvailability>();
  for (const y of standaloneYarns) {
    const total = y.quantity ?? 0;
    map.set(y.id, {
      totalQuantity: total,
      takenCount: 0,
      availableCount: total,
      takenBy: [],
    });
  }

  for (const project of projects) {
    if (!isProjectActive(project)) continue;
    for (const yarn of project.yarns || []) {
      if (!yarn.standaloneYarnId) continue;
      const entry = map.get(yarn.standaloneYarnId);
      if (!entry) continue;
      const allocated = yarn.quantity ?? 1;
      const consumed = yarn.quantityUsed ?? 0;
      const reserved = Math.max(0, allocated - consumed);
      if (reserved <= 0) continue;
      entry.takenCount += reserved;
      entry.takenBy.push({
        projectId: project.id,
        projectName: project.name,
        quantity: reserved,
      });
    }
  }

  for (const entry of map.values()) {
    if (entry.takenCount > entry.totalQuantity) {
      entry.takenCount = entry.totalQuantity;
    }
    entry.availableCount = Math.max(0, entry.totalQuantity - entry.takenCount);
  }

  return map;
}

export type YarnStatusKind = 'free' | 'busy' | 'partial' | 'empty';

export function yarnStatusKind(a: YarnAvailability): YarnStatusKind {
  if (a.totalQuantity === 0) return 'empty';
  if (a.takenCount === 0) return 'free';
  if (a.availableCount === 0) return 'busy';
  return 'partial';
}
