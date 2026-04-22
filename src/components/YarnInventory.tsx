import { useState } from 'react';
import type { KnittingProject, Yarn, YarnWeight } from '../types/knitting';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';

interface YarnInventoryProps {
  projects: KnittingProject[];
  standaloneYarns: Yarn[];
  onUpdateStandaloneYarns: (yarns: Yarn[]) => void;
}

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width={10} height={10} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/>
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>
  </svg>
);

export function YarnInventory({ projects, standaloneYarns, onUpdateStandaloneYarns }: YarnInventoryProps) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'inuse' | 'spare'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newYarn, setNewYarn] = useState<Partial<Yarn>>({});

  // Combine project yarns + standalone yarns into unified list
  interface YarnEntry {
    id: string;
    name: string;
    color?: string;
    colorHex?: string;
    weight?: YarnWeight;
    fiberContent?: string;
    yardage?: string;
    dyeLot?: string;
    amount?: string;
    price?: number;
    notes?: string;
    usedInProjects: { id: string; name: string }[];
    isStandalone: boolean;
    standaloneId?: string;
  }

  const entries: YarnEntry[] = [];

  // From standalone yarns
  standaloneYarns.forEach(y => {
    const usedIn = projects.filter(p => p.yarns.some(py => py.standaloneYarnId === y.id));
    entries.push({
      id: y.id,
      name: y.name,
      color: y.color,
      weight: y.weight,
      fiberContent: y.fiberContent,
      yardage: y.yardage,
      dyeLot: y.dyeLot,
      amount: y.amount,
      price: y.price,
      notes: y.notes,
      usedInProjects: usedIn.map(p => ({ id: p.id, name: p.name })),
      isStandalone: true,
      standaloneId: y.id,
    });
  });

  // From project yarns not already covered by standalone
  projects.forEach(p => {
    p.yarns.forEach(y => {
      if (y.standaloneYarnId) return; // already covered
      const key = y.id;
      const existing = entries.find(e => e.id === key);
      if (existing) {
        if (!existing.usedInProjects.some(pp => pp.id === p.id)) {
          existing.usedInProjects.push({ id: p.id, name: p.name });
        }
      } else {
        entries.push({
          id: key,
          name: y.name,
          color: y.color,
          weight: y.weight,
          fiberContent: y.fiberContent,
          yardage: y.yardage,
          dyeLot: y.dyeLot,
          amount: y.amount,
          usedInProjects: [{ id: p.id, name: p.name }],
          isStandalone: false,
        });
      }
    });
  });

  const filtered = entries.filter(y => {
    if (q && !y.name.toLowerCase().includes(q.toLowerCase()) && !y.color?.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'inuse' && y.usedInProjects.length === 0) return false;
    if (filter === 'spare' && y.usedInProjects.length > 0) return false;
    return true;
  });

  const totalEntries = entries.length;
  const inUseCount = entries.filter(y => y.usedInProjects.length > 0).length;
  const colors = new Set(entries.map(y => y.color || y.name)).size;

  const handleAdd = () => {
    if (!newYarn.name?.trim()) { toast.error('Garnnavn er påkrevd'); return; }
    const yarn: Yarn = {
      id: crypto.randomUUID(),
      name: newYarn.name.trim(),
      color: newYarn.color?.trim(),
      weight: newYarn.weight,
      fiberContent: newYarn.fiberContent?.trim(),
      yardage: newYarn.yardage?.trim(),
      dyeLot: newYarn.dyeLot?.trim(),
      amount: newYarn.amount?.trim(),
      price: newYarn.price,
      notes: newYarn.notes?.trim(),
    };
    onUpdateStandaloneYarns([...standaloneYarns, yarn]);
    setNewYarn({});
    setShowAdd(false);
    toast.success('Garn lagt til');
  };

  const handleDelete = (standaloneId: string) => {
    onUpdateStandaloneYarns(standaloneYarns.filter(y => y.id !== standaloneId));
    toast.success('Garn fjernet');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Lager</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>Garn</div>
      </div>

      {/* Summary stats */}
      <div style={{ padding: '12px 20px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Totalt', value: totalEntries },
          { label: 'Farger', value: colors },
          { label: 'I bruk', value: inUseCount },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--muted-fg)', letterSpacing: 1.3, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, marginTop: 3 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--muted-fg)' }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Søk i garn…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--fg)', fontFamily: 'var(--font-ui)' }}/>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding: '0 20px 8px', display: 'flex', gap: 8 }}>
        {[
          { id: 'all' as const, label: 'Alle' },
          { id: 'inuse' as const, label: 'I prosjekt' },
          { id: 'spare' as const, label: 'Ubrukt' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            display: 'inline-flex', alignItems: 'center',
            height: 30, padding: '0 12px', borderRadius: 999,
            fontSize: 13, fontWeight: 500,
            border: '1px solid ' + (filter === f.id ? 'var(--fg)' : 'var(--border)'),
            background: filter === f.id ? 'var(--fg)' : 'transparent',
            color: filter === f.id ? 'var(--bg)' : 'var(--fg)',
            cursor: 'pointer', fontFamily: 'var(--font-ui)',
          }}>{f.label}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 120px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted-fg)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, color: 'var(--fg)', marginBottom: 6 }}>Ingen garn funnet</div>
          </div>
        ) : filtered.map(y => (
          <div key={y.id} style={{
            display: 'flex', alignItems: 'stretch', gap: 14,
            padding: 14, marginBottom: 10,
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
          }}>
            {/* Color swatch */}
            <div style={{
              width: 56, height: 56, borderRadius: 12, flexShrink: 0,
              background: y.colorHex || (y.color ? '#b9aa93' : 'var(--accent)'),
              border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!y.colorHex && (
                <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="var(--muted-fg)" strokeWidth="1.4" strokeLinecap="round" opacity={0.5}>
                  <circle cx="12" cy="12" r="8.5"/>
                  <path d="M6 7c3 4 9 4 12 0M6 12c3 4 9 4 12 0M6 17c3 4 9 4 12 0"/>
                </svg>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{y.name}</div>
                {y.amount && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', flexShrink: 0 }}>{y.amount}</div>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 2 }}>
                {[y.color, y.weight, y.fiberContent].filter(Boolean).join(' · ')}
              </div>
              {y.usedInProjects.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {y.usedInProjects.map(p => (
                    <span key={p.id} style={{
                      height: 22, padding: '0 8px', borderRadius: 999, border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--fg)', fontSize: 11, fontWeight: 500,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                    }}>
                      <LinkIcon /> {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {y.isStandalone && (
              <button onClick={() => handleDelete(y.standaloneId!)} style={{ alignSelf: 'flex-start', marginTop: 2, width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrashIcon />
              </button>
            )}

          </div>
        ))}
      </div>

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} style={{
        position: 'absolute', right: 20, bottom: 20, zIndex: 25,
        height: 54, padding: '0 20px 0 16px', borderRadius: 999,
        background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none',
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        fontFamily: 'var(--font-ui)', fontSize: 14.5, fontWeight: 600,
        boxShadow: '0 8px 24px -6px color-mix(in oklab, var(--primary) 45%, transparent)',
      }}>
        <PlusIcon /> Nytt garn
      </button>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Legg til garn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Garnnavn *</Label>
              <Input value={newYarn.name || ''} onChange={e => setNewYarn({ ...newYarn, name: e.target.value })} placeholder="F.eks. Sandnes Alpakka" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Farge</Label>
                <Input value={newYarn.color || ''} onChange={e => setNewYarn({ ...newYarn, color: e.target.value })} placeholder="F.eks. Natur" />
              </div>
              <div className="space-y-2">
                <Label>Mengde</Label>
                <Input value={newYarn.amount || ''} onChange={e => setNewYarn({ ...newYarn, amount: e.target.value })} placeholder="F.eks. 3 nøster" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tykkelse</Label>
                <select value={newYarn.weight || ''} onChange={e => setNewYarn({ ...newYarn, weight: (e.target.value || undefined) as YarnWeight | undefined })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Velg...</option>
                  {['Lace','Fingering','Sport','DK','Worsted','Aran','Bulky','Super Bulky'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fiberinnhold</Label>
                <Input value={newYarn.fiberContent || ''} onChange={e => setNewYarn({ ...newYarn, fiberContent: e.target.value })} placeholder="100% Ull" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Løpelengde</Label>
                <Input value={newYarn.yardage || ''} onChange={e => setNewYarn({ ...newYarn, yardage: e.target.value })} placeholder="200m / 50g" />
              </div>
              <div className="space-y-2">
                <Label>Fargebad</Label>
                <Input value={newYarn.dyeLot || ''} onChange={e => setNewYarn({ ...newYarn, dyeLot: e.target.value })} placeholder="Lot 2345" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notater</Label>
              <Textarea value={newYarn.notes || ''} onChange={e => setNewYarn({ ...newYarn, notes: e.target.value })} placeholder="F.eks. Kjøpt på salg..." className="min-h-[60px] resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} className="flex-1">Legg til</Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setNewYarn({}); }} className="flex-1">Avbryt</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
