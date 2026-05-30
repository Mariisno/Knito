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
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const ImageIcon = () => (
  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
  </svg>
);

export function NeedleInventory({ projects, needleInventory, onUpdateNeedleInventory }: NeedleInventoryProps) {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [editingNeedle, setEditingNeedle] = useState<NeedleInventoryItem | null>(null);
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

  const handleEdit = (needle: NeedleInventoryItem) => {
    setEditingNeedle(needle);
  };

  const handleSaveEdit = () => {
    if (!editingNeedle) return;
    if (!editingNeedle.size?.trim()) { toast.error(t('common.size') + ' ' + t('common.required')); return; }

    onUpdateNeedleInventory(needleInventory.map(n => n.id === editingNeedle.id ? editingNeedle : n));
    setEditingNeedle(null);
    toast.success(t('toasts.needleUpdated'));
  };

  const handleDuplicate = (needle: NeedleInventoryItem) => {
    const duplicated: NeedleInventoryItem = {
      ...needle,
      id: crypto.randomUUID(),
    };
    onUpdateNeedleInventory([...needleInventory, duplicated]);
    toast.success(t('toasts.needleDuplicated'));
  };

  const handleImageUpload = (needle: NeedleInventoryItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('toasts.fileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      if (editingNeedle && editingNeedle.id === needle.id) {
        setEditingNeedle({ ...editingNeedle, imageUrl });
      } else {
        onUpdateNeedleInventory(needleInventory.map(n => n.id === needle.id ? { ...n, imageUrl } : n));
        toast.success(t('toasts.imageAdded'));
      }
    };
    reader.readAsDataURL(file);
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
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--accent)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => handleEdit(n)}>
                      {/* Image or Size badge */}
                      {n.imageUrl ? (
                        <div style={{
                          minWidth: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                          border: '1px solid var(--border)',
                        }}>
                          <img src={n.imageUrl} alt={n.size} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{
                          minWidth: 52, height: 52, borderRadius: 10, background: 'var(--accent)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, letterSpacing: -0.3, flexShrink: 0,
                        }}>
                          {n.size}
                          {n.length && <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.6, marginTop: 1 }}>{n.length}</span>}
                        </div>
                      )}

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

                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                          {n.quantity > 1
                            ? `×${availability.availableCount}/${availability.totalQuantity}`
                            : `×${n.quantity}`}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={(e) => { e.stopPropagation(); handleDuplicate(n); }}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title={t('common.duplicate')}>
                            <CopyIcon />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title={t('common.delete')}>
                            <TrashIcon />
                          </button>
                        </div>
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

      {/* Edit dialog */}
      <Dialog open={!!editingNeedle} onOpenChange={(open) => !open && setEditingNeedle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('needles.editNeedle')}</DialogTitle>
            <DialogDescription>{t('needles.editDescription')}</DialogDescription>
          </DialogHeader>
          {editingNeedle && (
            <div className="space-y-4 py-2">
              {/* Image upload */}
              <div className="space-y-2">
                <Label>{t('common.image')}</Label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {editingNeedle.imageUrl && (
                    <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={editingNeedle.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(editingNeedle, e)}
                      style={{ display: 'none' }}
                      id="needle-image-upload"
                    />
                    <Button variant="outline" onClick={() => document.getElementById('needle-image-upload')?.click()} className="w-full">
                      <ImageIcon /> {editingNeedle.imageUrl ? t('common.changeImage') : t('common.addImage')}
                    </Button>
                    {editingNeedle.imageUrl && (
                      <Button variant="ghost" onClick={() => setEditingNeedle({ ...editingNeedle, imageUrl: undefined })} className="w-full mt-2">
                        {t('common.removeImage')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div className="space-y-2">
                  <Label>{t('common.type')} *</Label>
                  <Select value={editingNeedle.type} onValueChange={v => setEditingNeedle({ ...editingNeedle, type: v })}>
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
                  <Input value={editingNeedle.size} onChange={e => setEditingNeedle({ ...editingNeedle, size: e.target.value })} placeholder="4mm" />
                </div>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div className="space-y-2">
                  <Label>{t('common.length')}</Label>
                  <Input value={editingNeedle.length || ''} onChange={e => setEditingNeedle({ ...editingNeedle, length: e.target.value })} placeholder={t('needles.lengthPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.material')}</Label>
                  <Input value={editingNeedle.material || ''} onChange={e => setEditingNeedle({ ...editingNeedle, material: e.target.value })} placeholder={t('needles.materialPlaceholder')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('common.quantity')}</Label>
                <Input type="number" min="1" value={editingNeedle.quantity} onChange={e => setEditingNeedle({ ...editingNeedle, quantity: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} className="flex-1">{t('common.save')}</Button>
                <Button variant="outline" onClick={() => setEditingNeedle(null)} className="flex-1">{t('common.cancel')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
