import { useState } from 'react';
import type { KnittingProject, Yarn, YarnWeight } from '../types/knitting';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import * as api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { YarnFormFields } from './YarnFormFields';

interface YarnInventoryProps {
  projects: KnittingProject[];
  standaloneYarns: Yarn[];
  onUpdateStandaloneYarns: (yarns: Yarn[]) => void;
  onUpdateStandaloneYarn: (yarn: Yarn) => void;
  onDeleteStandaloneYarn: (id: string) => void;
}

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const StepPlusIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const MinusIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12h14"/>
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

export function YarnInventory({
  projects,
  standaloneYarns,
  onUpdateStandaloneYarns,
  onUpdateStandaloneYarn,
  onDeleteStandaloneYarn,
}: YarnInventoryProps) {
  const { accessToken } = useAuth();
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'inuse' | 'spare'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newYarn, setNewYarn] = useState<Partial<Yarn>>({});
  const [editingYarn, setEditingYarn] = useState<Yarn | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; usedIn: string[] } | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Combine project yarns + standalone yarns into unified list
  interface YarnEntry {
    id: string;
    name: string;
    brand?: string;
    color?: string;
    colorHex?: string;
    weight?: YarnWeight;
    fiberContent?: string;
    yardage?: string;
    dyeLot?: string;
    amount?: string;
    quantity?: number;
    price?: number;
    notes?: string;
    imageUrl?: string;
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
      brand: y.brand,
      color: y.color,
      weight: y.weight,
      fiberContent: y.fiberContent,
      yardage: y.yardage,
      dyeLot: y.dyeLot,
      amount: y.amount,
      quantity: y.quantity,
      price: y.price,
      notes: y.notes,
      imageUrl: y.imageUrl,
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
          imageUrl: y.imageUrl,
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
    if (!newYarn.name?.trim()) { toast.error(t('yarn.yarnName') + ' ' + t('common.required')); return; }
    const yarn: Yarn = {
      id: crypto.randomUUID(),
      name: newYarn.name.trim(),
      brand: newYarn.brand?.trim() || undefined,
      color: newYarn.color?.trim(),
      amount: newYarn.amount?.trim() || undefined,
      quantity: newYarn.quantity ?? 1,
      weight: newYarn.weight,
      fiberContent: newYarn.fiberContent?.trim(),
      yardage: newYarn.yardage?.trim(),
      dyeLot: newYarn.dyeLot?.trim(),
      price: newYarn.price,
      notes: newYarn.notes?.trim(),
      imageUrl: newYarn.imageUrl,
    };
    onUpdateStandaloneYarns([...standaloneYarns, yarn]);
    setNewYarn({});
    setShowAdd(false);
    toast.success(t('toasts.yarnAdded'));
  };

  const handleSaveEdit = () => {
    if (!editingYarn) return;
    if (!editingYarn.name?.trim()) { toast.error(t('yarn.yarnName') + ' ' + t('common.required')); return; }
    const updated: Yarn = {
      ...editingYarn,
      name: editingYarn.name.trim(),
      brand: editingYarn.brand?.trim() || undefined,
      color: editingYarn.color?.trim(),
      amount: editingYarn.amount?.trim() || undefined,
      fiberContent: editingYarn.fiberContent?.trim(),
      yardage: editingYarn.yardage?.trim(),
      dyeLot: editingYarn.dyeLot?.trim(),
      notes: editingYarn.notes?.trim(),
    };
    onUpdateStandaloneYarn(updated);
    setEditingYarn(null);
    toast.success(t('toasts.yarnUpdated'));
  };

  const handleUploadImage = async (
    file: File,
    setImage: (url: string) => void,
  ) => {
    if (!accessToken) { toast.error(t('toasts.couldNotSignIn')); return; }
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      setImage(url);
      toast.success(t('toasts.imageAdded'));
    } catch {
      toast.error(t('toasts.imageUploadFailed'));
    } finally {
      setUploadingImg(false);
    }
  };

  const requestDelete = (standaloneId: string) => {
    const yarn = standaloneYarns.find(y => y.id === standaloneId);
    if (!yarn) return;
    const usedIn = projects
      .filter(p => p.yarns.some(py => py.standaloneYarnId === standaloneId))
      .map(p => p.name);
    if (usedIn.length === 0) {
      onDeleteStandaloneYarn(standaloneId);
      toast.success(t('toasts.yarnDeleted'));
      return;
    }
    setPendingDelete({ id: standaloneId, name: yarn.name, usedIn });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    onDeleteStandaloneYarn(pendingDelete.id);
    setPendingDelete(null);
    toast.success(t('toasts.yarnDeleted'));
  };

  const handleQuantityChange = (standaloneId: string, delta: number) => {
    const yarn = standaloneYarns.find(y => y.id === standaloneId);
    if (!yarn) return;
    const current = yarn.quantity ?? 1;
    const next = Math.max(0, current + delta);
    onUpdateStandaloneYarns(standaloneYarns.map(y =>
      y.id === standaloneId ? { ...y, quantity: next } : y
    ));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>{t('yarn.inventory')}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{t('yarn.title')}</div>
      </div>

      {/* Summary stats */}
      <div style={{ padding: '12px 20px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: t('common.all'), value: totalEntries },
          { label: t('common.color'), value: colors },
          { label: t('yarn.inUse'), value: inUseCount },
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
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('common.search') + '…'}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--fg)', fontFamily: 'var(--font-ui)' }}/>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding: '0 20px 8px', display: 'flex', gap: 8 }}>
        {[
          { id: 'all' as const, label: t('common.all') },
          { id: 'inuse' as const, label: t('yarn.inUse') },
          { id: 'spare' as const, label: t('yarn.available') },
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
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, color: 'var(--fg)', marginBottom: 6 }}>{t('yarn.emptyTitle')}</div>
          </div>
        ) : filtered.map(y => {
          const qty = y.quantity ?? (y.isStandalone ? 1 : undefined);
          const qtyLabel = qty !== undefined ? `${qty}` : null;
          return (
          <div key={y.id}
            onClick={y.isStandalone && y.standaloneId ? () => {
              const yarn = standaloneYarns.find(yy => yy.id === y.standaloneId);
              if (yarn) setEditingYarn({ ...yarn });
            } : undefined}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: 14, marginBottom: 10,
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
              cursor: y.isStandalone ? 'pointer' : 'default',
            }}>
            {/* Color swatch / image */}
            <div style={{
              width: 76, height: 76, borderRadius: 14, flexShrink: 0,
              background: y.imageUrl ? 'var(--bg)' : (y.colorHex || (y.color ? '#b9aa93' : 'var(--accent)')),
              border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {y.imageUrl ? (
                <img src={y.imageUrl} alt={y.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : !y.colorHex && (
                <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="var(--muted-fg)" strokeWidth="1.4" strokeLinecap="round" opacity={0.55}>
                  <circle cx="12" cy="12" r="8.5"/>
                  <path d="M6 7c3 4 9 4 12 0M6 12c3 4 9 4 12 0M6 17c3 4 9 4 12 0"/>
                </svg>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{y.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 2 }}>
                    {[y.color && `${t('common.color')}: ${y.color}`, y.weight, y.fiberContent].filter(Boolean).join(' · ') || ' '}
                  </div>
                </div>
                {y.isStandalone && (
                  <button
                    onClick={(e) => { e.stopPropagation(); requestDelete(y.standaloneId!); }}
                    aria-label={t('yarn.deleteYarn')}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>

              {y.isStandalone ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
                  onClick={(e) => e.stopPropagation()}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    height: 32, borderRadius: 999,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(y.standaloneId!, -1); }}
                      disabled={(y.quantity ?? 1) <= 0}
                      aria-label={t('projectDetail.decrement')}
                      style={{
                        width: 36, height: '100%', border: 'none', background: 'transparent',
                        color: 'var(--fg)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: (y.quantity ?? 1) <= 0 ? 0.35 : 1,
                      }}
                    >
                      <MinusIcon />
                    </button>
                    <div style={{
                      minWidth: 28, padding: '0 4px', textAlign: 'center',
                      fontSize: 14, fontWeight: 600, color: 'var(--fg)', fontFamily: 'var(--font-ui)',
                    }}>{y.quantity ?? 1}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(y.standaloneId!, 1); }}
                      aria-label={t('projectDetail.increment')}
                      style={{
                        width: 36, height: '100%', border: 'none', background: 'transparent',
                        color: 'var(--fg)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <StepPlusIcon />
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>
                    {qtyLabel}
                  </div>
                </div>
              ) : y.amount ? (
                <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>{y.amount}</div>
              ) : null}

              {y.usedInProjects.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
          </div>
          );
        })}
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
        <PlusIcon /> {t('projects.newYarn')}
      </button>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('yarn.addYarn')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <YarnFormFields
              value={newYarn}
              onChange={setNewYarn}
              uploadingImg={uploadingImg}
              onUploadImage={handleUploadImage}
            />
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} className="flex-1" disabled={uploadingImg}>{t('common.add')}</Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setNewYarn({}); }} className="flex-1">{t('common.cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingYarn} onOpenChange={(open) => { if (!open) setEditingYarn(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('yarn.editYarn')}</DialogTitle>
          </DialogHeader>
          {editingYarn && (
            <div className="space-y-4 py-2">
              <YarnFormFields
                value={editingYarn}
                onChange={(next) => setEditingYarn(next as Yarn)}
                uploadingImg={uploadingImg}
                onUploadImage={handleUploadImage}
              />
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} className="flex-1" disabled={uploadingImg}>{t('common.save')}</Button>
                <Button variant="outline" onClick={() => setEditingYarn(null)} className="flex-1">{t('common.cancel')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={open => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('yarn.deleteYarnConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>
                  {pendingDelete.name}
                  {' — '}
                  {pendingDelete.usedIn.join(', ')}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="flex-1 bg-destructive hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
