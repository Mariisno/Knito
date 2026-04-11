// Type definitions for knitting project management

export interface Yarn {
  id: string;
  name: string;
  brand?: string;
  color?: string;
  amount?: string;
  notes?: string; // For standalone yarn inventory
}

export interface Needle {
  id: string;
  size: string;
  type: string;
  length?: string;
  material?: string;
  inventoryNeedleId?: string; // links to NeedleInventoryItem.id if chosen from inventory
}

export interface NeedleInventoryItem {
  id: string;
  size: string;       // e.g. "4mm"
  type: string;       // e.g. "Rundpinne", "Strømpepinne"
  length?: string;    // e.g. "80cm"
  material?: string;  // e.g. "Bambus", "Metall"
  quantity: number;   // how many the user owns
}

export type ProjectStatus = 'Aktiv' | 'Fullført' | 'Planlagt' | 'På vent';

export interface TimeLog {
  startTime: Date;
  endTime?: Date;
}

export interface Counter {
  id: string;
  label: string;
  count: number;
}

export interface LogEntry {
  id: string;
  text: string;
  timestamp: Date;
}

export interface KnittingProject {
  id: string;
  name: string;
  progress: number;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  recipe?: string;
  notes?: string;
  logEntries?: LogEntry[]; // Log entries for project notes
  images: string[];
  yarns: Yarn[];
  needles: Needle[];
  otherInfo?: string;
  createdAt: Date;
  timeSpentMinutes?: number; // Total time spent on project
  currentTimeLog?: TimeLog; // Active time tracking session
  category?: string; // e.g. "Sokker", "Genser", "Skjerf"
  counters?: Counter[]; // Row/stitch counters
}
