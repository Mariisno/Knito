// Type definitions for knitting project management

export type YarnWeight = 'Lace' | 'Fingering' | 'Sport' | 'DK' | 'Worsted' | 'Aran' | 'Bulky' | 'Super Bulky';

export interface Yarn {
  id: string;
  name: string;
  brand?: string;
  color?: string;
  amount?: string;
  weight?: YarnWeight;        // yarn weight category
  fiberContent?: string;      // e.g. "100% Merino", "80% Alpakka, 20% Silke"
  yardage?: string;           // e.g. "200m per 50g"
  dyeLot?: string;            // dye lot number for color matching
  price?: number;             // price per skein/ball in local currency
  notes?: string;             // For standalone yarn inventory
  standaloneYarnId?: string;  // links to standalone Yarn.id if chosen from inventory
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

export type ProjectStatus = 'Aktiv' | 'Fullført' | 'Planlagt' | 'På vent' | 'Arkivert';

export interface TimeLog {
  startTime: Date;
  endTime?: Date;
}

export interface Counter {
  id: string;
  label: string;
  count: number;
  previousCount?: number; // for undo support
}

export interface LogEntry {
  id: string;
  text: string;
  timestamp: Date;
}

export interface GaugeSwatch {
  stitchesPer10cm?: number;   // stitches per 10cm
  rowsPer10cm?: number;       // rows per 10cm
  needleSize?: string;        // needle size used for swatch
  notes?: string;             // swatch notes
}

export interface PatternInfo {
  url?: string;               // link to pattern (Ravelry, etc.)
  name?: string;              // pattern name
  designer?: string;          // pattern designer
  currentRow?: number;        // where user is in the pattern
  totalRows?: number;         // total rows in pattern (if known)
  pdfUrl?: string;            // uploaded PDF file URL
  pdfName?: string;           // original PDF filename
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
  logEntries?: LogEntry[];    // Log entries for project notes
  images: string[];
  yarns: Yarn[];
  needles: Needle[];
  otherInfo?: string;
  createdAt: Date;
  timeSpentMinutes?: number;  // Total time spent on project
  currentTimeLog?: TimeLog;   // Active time tracking session
  category?: string;          // e.g. "Sokker", "Genser", "Skjerf"
  counters?: Counter[];       // Row/stitch counters
  gauge?: GaugeSwatch;        // Gauge swatch measurement
  pattern?: PatternInfo;      // Pattern reference and tracking
}
