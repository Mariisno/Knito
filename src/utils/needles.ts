import type { KnittingProject, NeedleInventoryItem, ProjectStatus } from '../types/knitting';

export const ACTIVE_PROJECT_STATUSES: readonly ProjectStatus[] = [
  'Aktiv',
  'Planlagt',
  'På vent',
];

export function isProjectActive(project: KnittingProject): boolean {
  return ACTIVE_PROJECT_STATUSES.includes(project.status);
}

export interface NeedleAvailability {
  totalQuantity: number;
  takenCount: number;
  availableCount: number;
  takenBy: { projectId: string; projectName: string }[];
}

export function getAllNeedleAvailability(
  needleInventory: NeedleInventoryItem[],
  projects: KnittingProject[],
): Map<string, NeedleAvailability> {
  const map = new Map<string, NeedleAvailability>();
  for (const item of needleInventory) {
    map.set(item.id, {
      totalQuantity: item.quantity,
      takenCount: 0,
      availableCount: item.quantity,
      takenBy: [],
    });
  }

  for (const project of projects) {
    if (!isProjectActive(project)) continue;
    for (const needle of project.needles || []) {
      if (!needle.inventoryNeedleId) continue;
      const entry = map.get(needle.inventoryNeedleId);
      if (!entry) continue;
      entry.takenCount += needle.quantity ?? 1;
      entry.takenBy.push({ projectId: project.id, projectName: project.name });
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

export function formatNeedleStatus(a: NeedleAvailability): string {
  if (a.takenCount === 0) return 'Ledig';
  if (a.availableCount === 0) return 'Opptatt';
  return `${a.takenCount} / ${a.totalQuantity} i bruk`;
}

export function syncNeedleToInventory(
  needle: { size: string; type: string; length?: string; material?: string; quantity: number },
  inventory: NeedleInventoryItem[],
): { updatedInventory: NeedleInventoryItem[]; inventoryNeedleId: string } {
  const match = inventory.find(i => i.size === needle.size && i.type === needle.type);
  if (match) {
    return {
      updatedInventory: inventory.map(i =>
        i.id === match.id ? { ...i, quantity: i.quantity + needle.quantity } : i,
      ),
      inventoryNeedleId: match.id,
    };
  }
  const newItem: NeedleInventoryItem = {
    id: crypto.randomUUID(),
    size: needle.size,
    type: needle.type,
    length: needle.length,
    material: needle.material,
    quantity: needle.quantity,
  };
  return { updatedInventory: [...inventory, newItem], inventoryNeedleId: newItem.id };
}
