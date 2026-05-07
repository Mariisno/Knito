import type { KnittingProject } from '../types/knitting';
import { useProjectStats } from '../hooks/useProjectStats';
import { useTranslation } from '../contexts/LanguageContext';

interface StatisticsViewProps {
  projects: KnittingProject[];
}

export function StatisticsView({ projects }: StatisticsViewProps) {
  const stats = useProjectStats(projects);
  const { t } = useTranslation();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>{t('stats.title')}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{t('stats.title')}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 40px' }}>
        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: t('stats.activeProjects'), value: stats.active, hint: '' },
            { label: t('stats.completedProjects'), value: stats.completed, hint: '' },
            { label: t('tabs.yarn'), value: stats.totalYarns, hint: '' },
            { label: t('stats.usedSkeins'), value: stats.totalSkeinsUsed, hint: '' },
            { label: t('stats.averageProgress'), value: `${stats.avgProgress}%`, hint: '' },
          ].map(s => (
            <div key={s.label} style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--muted-fg)', letterSpacing: 1.3, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              {s.hint && <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', marginTop: 1 }}>{s.hint}</div>}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
