import type { KnittingProject } from '../types/knitting';
import { useProjectStats } from '../hooks/useProjectStats';
import { KnitTexture, paletteForId } from './KnitTexture';

interface StatisticsViewProps {
  projects: KnittingProject[];
}

export function StatisticsView({ projects }: StatisticsViewProps) {
  const stats = useProjectStats(projects);

  const totalHrs = Math.floor(stats.totalTime / 60);
  const totalMins = stats.totalTime % 60;

  const topProjects = [...projects]
    .sort((a, b) => (b.timeSpentMinutes || 0) - (a.timeSpentMinutes || 0))
    .slice(0, 4);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Oversikt</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>Statistikk</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 40px' }}>
        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total tid', value: stats.totalTime > 0 ? `${totalHrs}t ${totalMins > 0 ? totalMins + 'm' : ''}` : '—', hint: 'strikket totalt' },
            { label: 'Aktive', value: stats.active, hint: 'prosjekter' },
            { label: 'Fullført', value: stats.completed, hint: 'så langt' },
            { label: 'Garn', value: stats.totalYarns, hint: 'oppføringer' },
          ].map(s => (
            <div key={s.label} style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--muted-fg)', letterSpacing: 1.3, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              {s.hint && <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', marginTop: 1 }}>{s.hint}</div>}
            </div>
          ))}
        </div>

        {/* Top projects by time */}
        {topProjects.length > 0 && (
          <>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500, padding: '4px 2px 10px' }}>
              Mest tid brukt
            </div>
            {topProjects.map(p => {
              const mins = p.timeSpentMinutes || 0;
              const hrs = Math.floor(mins / 60);
              const m = mins % 60;
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 8,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    {p.images[0]
                      ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      : <KnitTexture variant={paletteForId(p.id)}/>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 1 }}>{p.progress}% · {p.status}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {mins > 0 ? `${hrs}t${m > 0 ? ` ${m}m` : ''}` : '—'}
                  </div>
                </div>
              );
            })}
          </>
        )}


      </div>
    </div>
  );
}
