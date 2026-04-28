import type { KnittingProject, Yarn } from '../types/knitting';

export function exportProjectAsJSON(project: KnittingProject) {
  const data = JSON.stringify(project, null, 2);
  downloadFile(data, `${sanitizeFilename(project.name)}.json`, 'application/json');
}

export function exportAllDataAsJSON(projects: KnittingProject[], standaloneYarns: Yarn[], needleInventory: any[]) {
  const data = JSON.stringify({ projects, standaloneYarns, needleInventory, exportedAt: new Date().toISOString() }, null, 2);
  downloadFile(data, `knito-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

export function exportProjectAsText(project: KnittingProject): string {
  const lines: string[] = [];
  lines.push(`# ${project.name}`);
  lines.push('');
  lines.push(`Status: ${project.status}`);
  lines.push(`Fremgang: ${project.progress}%`);
  if (project.category) lines.push(`Kategori: ${project.category}`);
  if (project.startDate) lines.push(`Startdato: ${new Date(project.startDate).toLocaleDateString('nb-NO')}`);
  if (project.endDate) lines.push(`Sluttdato: ${new Date(project.endDate).toLocaleDateString('nb-NO')}`);
  if (project.gauge) {
    lines.push('');
    lines.push('## Strikkefasthet');
    if (project.gauge.stitchesPer10cm) lines.push(`Masker per 10cm: ${project.gauge.stitchesPer10cm}`);
    if (project.gauge.rowsPer10cm) lines.push(`Pinner per 10cm: ${project.gauge.rowsPer10cm}`);
    if (project.gauge.needleSize) lines.push(`Pinnestørrelse: ${project.gauge.needleSize}`);
    if (project.gauge.notes) lines.push(`Notat: ${project.gauge.notes}`);
  }

  if (project.pattern) {
    lines.push('');
    lines.push('## Mønster');
    if (project.pattern.name) lines.push(`Navn: ${project.pattern.name}`);
    if (project.pattern.designer) lines.push(`Designer: ${project.pattern.designer}`);
    if (project.pattern.url) lines.push(`Lenke: ${project.pattern.url}`);
    if (project.pattern.currentRow) lines.push(`Nåværende rad: ${project.pattern.currentRow}${project.pattern.totalRows ? ` av ${project.pattern.totalRows}` : ''}`);
  }

  if (project.yarns.length > 0) {
    lines.push('');
    lines.push('## Garn');
    project.yarns.forEach(y => {
      const parts = [y.name, y.brand, y.color, y.amount, y.weight, y.fiberContent].filter(Boolean);
      lines.push(`- ${parts.join(' | ')}`);
      if (y.dyeLot) lines.push(`  Fargebad: ${y.dyeLot}`);
      if (y.price) lines.push(`  Pris: ${y.price} kr`);
    });
  }

  if (project.needles.length > 0) {
    lines.push('');
    lines.push('## Pinner');
    project.needles.forEach(n => {
      const parts = [n.type, n.size, n.length, n.material].filter(Boolean);
      lines.push(`- ${parts.join(' | ')}`);
    });
  }

  if (project.counters && project.counters.length > 0) {
    lines.push('');
    lines.push('## Tellere');
    project.counters.forEach(c => {
      lines.push(`- ${c.label}: ${c.count}`);
    });
  }

  if (project.recipe) {
    lines.push('');
    lines.push('## Oppskrift');
    lines.push(project.recipe);
  }

  if (project.logEntries && project.logEntries.length > 0) {
    lines.push('');
    lines.push('## Logg');
    project.logEntries.forEach(e => {
      const parts: string[] = [];
      if (e.text) parts.push(e.text);
      if (e.imageUrl) parts.push('[bilde]');
      lines.push(`- [${new Date(e.timestamp).toLocaleDateString('nb-NO')}] ${parts.join(' ')}`);
    });
  }

  return lines.join('\n');
}

export function exportProjectAsPrintable(project: KnittingProject) {
  const text = exportProjectAsText(project);
  downloadFile(text, `${sanitizeFilename(project.name)}.txt`, 'text/plain');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9æøåÆØÅ\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
