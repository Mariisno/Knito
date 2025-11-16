// Utility functions for progress-based color styling

export interface ProgressColors {
  badge: string;
  progressBar: string;
  progressBarFill: string;
}

/**
 * Get color classes based on progress percentage
 * - 0-33%: Rose/Pink (early stage)
 * - 34-66%: Orange/Amber (mid stage)
 * - 67-100%: Emerald/Teal (nearly complete/done)
 */
export function getProgressColors(progress: number): ProgressColors {
  if (progress < 34) {
    return {
      badge: 'text-rose-700 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200/50',
      progressBar: 'bg-gradient-to-r from-rose-100 to-pink-100',
      progressBarFill: 'bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500',
    };
  }
  
  if (progress < 67) {
    return {
      badge: 'text-orange-700 bg-gradient-to-r from-amber-50 to-orange-50 border-orange-200/50',
      progressBar: 'bg-gradient-to-r from-orange-100 to-amber-100',
      progressBarFill: 'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500',
    };
  }
  
  return {
    badge: 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200/50',
    progressBar: 'bg-gradient-to-r from-emerald-100 to-teal-100',
    progressBarFill: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500',
  };
}

/**
 * Get status badge colors based on project status
 */
export function getStatusColors(status: string): string {
  switch (status) {
    case 'Fullført':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Aktiv':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'På vent':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Planlagt':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

/**
 * Get status selector colors for the detail view
 */
export function getStatusSelectColors(status: string): string {
  switch (status) {
    case 'Fullført':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    case 'Aktiv':
      return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'På vent':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'Planlagt':
    default:
      return 'bg-slate-50 border-slate-200 text-slate-700';
  }
}

/**
 * Get alternating gradient colors for list items (yarn, needles, etc.)
 */
export const itemGradients = [
  'from-amber-50 to-orange-50',
  'from-rose-50 to-pink-50',
  'from-orange-50 to-rose-50',
  'from-yellow-50 to-amber-50',
] as const;

export function getItemGradient(index: number): string {
  return itemGradients[index % itemGradients.length];
}
