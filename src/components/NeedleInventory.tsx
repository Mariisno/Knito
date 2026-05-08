import { useMemo, useState } from 'react';
import type { KnittingProject, NeedleInventoryItem } from '../types/knitting';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { formatNeedleStatus, getAllNeedleAvailability } from '../utils/needles';
import { useTranslation } from '../contexts/LanguageContext';

interface NeedleInventoryProps {
  projects: KnittingProject[];
  needleInventory: NeedleInventoryItem[];
  onUpdateNeedleInventory: (needles: NeedleInventoryItem[]) => void;
}

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>
  </svg>
);

export function NeedleInventory({ projects, needleInventory, onUpdateNeedleInventory }: NeedleInventoryProps) {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [newNeedle, setNewNeedle] = useState<Partial<NeedleInventoryItem>>({ type: 'Rundpinne', quantity: 1 });

  const availabilityMap = useMemo(
    () => getAllNeedleAvailability(needleInventory, projects),
    [needleInventory, projects],
  );

  // Group by type
  const byType: Record<string, NeedleInventoryItem[]> = {};
  needleInventory.forEach(n => {
    (byType[n.type] ||= []).push(n);
  });

  const handleAdd = () => {
    if (!newNeedle.size?.trim()) { toast.error(t('common.size') + ' ' + t('common.required')); return; }
    const needle: NeedleInventoryItem = {
      id: crypto.randomUUID(),
      size: newNeedle.size.trim(),
      type: newNeedle.type || 'Rundpinne',
      length: newNeedle.length?.trim(),
      material: newNeedle.material?.trim(),
      quantity: newNeedle.quantity || 1,
    };
    onUpdateNeedleInventory([...needleInventory, needle]);
    setNewNeedle({ type: 'Rundpinne', quantity: 1 });
    setShowAdd(false);
    toast.success(t('toasts.needleAdded'));
  };

  const handleDelete = (id: string) => {
    onUpdateNeedleInventory(needleInventory.filter(n => n.id !== id));
    toast.success(t('toasts.needleDeleted'));
  };

  const isEmpty = needleInventory.length === 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>{t('needles.inventory')}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{t('needles.title')}</div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 120px' }}>
        {isEmpty ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted-fg)' }}>
            <div style={{ width: 72, height: 72, borderRadius: 999, margin: '0 auto 16px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="var(--fg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21l6-6M8 16l8-8 5-5-1 5-8 8z"/><circle cx="6.5" cy="17.5" r="1"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--fg)', marginBottom: 6 }}>{t('needles.emptyTitle')}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{t('needles.emptyDescription')}</div>
          </div>
        ) : (
          Object.entries(byType).map(([type, items]) => (
            <div key={type} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500, padding: '6px 2px 10px' }}>{t(`needleType.${type}`)}</div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {items.map((n, i) => {
                  const availability = availabilityMap.get(n.id) ?? {
                    totalQuantity: n.quantity,
                    takenCount: 0,
                    availableCount: n.quantity,
                    takenBy: [],
                  };
                  const statusLabel = formatNeedleStatus(availability);
                  const isFullyTaken = availability.availableCount === 0 && availability.totalQuantity > 0;
                  return (
                    <div key={n.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                    }}>
                      {/* Size badge */}
                      <div style={{
                        minWidth: 52, height: 52, borderRadius: 10, background: 'var(--accent)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, letterSpacing: -0.3, flexShrink: 0,
                      }}>
                        {n.size}
                        {n.length && <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.6, marginTop: 1 }}>{n.length}</span>}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{n.material || t(`needleType.${type}`)}</div>
                        <div style={{
                          fontSize: 11, marginTop: 2, fontWeight: isFullyTaken ? 600 : 500,
                          color: isFullyTaken ? 'var(--primary)' : 'var(--muted-fg)',
                        }}>
                          {statusLabel}
                        </div>
                        {availability.takenBy.length > 0 && (
                          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {availability.takenBy.map((p, idx) => (
                              <span key={idx} style={{
                                height: 18, padding: '0 6px', borderRadius: 4, border: 'none',
                                background: 'var(--accent)', color: 'var(--fg)', fontSize: 10.5,
                                display: 'inline-flex', alignItems: 'center',
                              }}>{p.projectName}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                          {n.quantity > 1
                            ? `×${availability.availableCount}/${availability.totalQuantity}`
                            : `×${n.quantity}`}
                        </div>
                        <button onClick={() => handleDelete(n.id)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
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
        <PlusIcon /> {t('projects.newNeedle')}
      </button>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('needles.addNeedle')}</DialogTitle>
            <DialogDescription>{t('needles.emptyDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              <div className="space-y-2">
                <Label>{t('common.type')} *</Label>
                <Select value={newNeedle.type} onValueChange={v => setNewNeedle({ ...newNeedle, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Rundpinne','Strømpepinne','Settpinner','Utskiftbar','Heklenål','Annet'].map(typeName => (
                      <SelectItem key={typeName} value={typeName}>{t(`needleType.${typeName}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('common.size')} *</Label>
                <Input value={newNeedle.size || ''} onChange={e => setNewNeedle({ ...newNeedle, size: e.target.value })} placeholder="4mm" />
              </div>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              <div className="space-y-2">
                <Label>{t('common.length')}</Label>
                <Input value={newNeedle.length || ''} onChange={e => setNewNeedle({ ...newNeedle, length: e.target.value })} placeholder={t('needles.lengthPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('common.material')}</Label>
                <Input value={newNeedle.material || ''} onChange={e => setNewNeedle({ ...newNeedle, material: e.target.value })} placeholder={t('needles.materialPlaceholder')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('common.quantity')}</Label>
              <Input type="number" min="1" value={newNeedle.quantity || 1} onChange={e => setNewNeedle({ ...newNeedle, quantity: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} className="flex-1">{t('common.add')}</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">{t('common.cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
