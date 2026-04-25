import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import type { KnittingProject, ProjectStatus, CraftType, Counter, LogEntry, NeedleInventoryItem, Yarn } from '../types/knitting';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import * as api from '../utils/api';
import { KnitTexture, paletteForId } from './KnitTexture';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ProjectDetailProps {
  project: KnittingProject;
  onBack: (tab?: string) => void;
  onUpdate: (project: KnittingProject) => void;
  onDelete: (projectId: string) => void;
  accessToken: string;
  needleInventory: NeedleInventoryItem[];
  standaloneYarns: Yarn[];
}

const STATUS_OPTIONS: ProjectStatus[] = ['Planlagt', 'Aktiv', 'På vent', 'Fullført', 'Arkivert'];

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Aktiv: '#7a8a6a', Fullført: '#5a7a6a', 'På vent': '#c9856b',
    Planlagt: 'var(--muted-fg)', Arkivert: 'var(--muted-fg)',
  };
  return <span style={{ width: 7, height: 7, borderRadius: 999, background: colors[status] || 'var(--muted-fg)', display: 'inline-block', flexShrink: 0 }} />;
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 20px 2px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 2px 10px' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500 }}>{title}</div>
        {count != null && count > 0 && <div style={{ fontSize: 11, color: 'var(--muted-fg)', fontVariantNumeric: 'tabular-nums' }}>{count}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

const dashedBtn: React.CSSProperties = {
  width: '100%', height: 44, borderRadius: 14,
  border: '1px dashed var(--border)', background: 'transparent',
  color: 'var(--muted-fg)', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 13, fontWeight: 500,
};

export function ProjectDetail({ project, onBack, onUpdate, onDelete, accessToken, needleInventory, standaloneYarns }: ProjectDetailProps) {
  const [editedProject, setEditedProject] = useState(project);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRemoveRecipeDialog, setShowRemoveRecipeDialog] = useState(false);
  const [deleteLogEntryId, setDeleteLogEntryId] = useState<string | null>(null);
  const [editingLogEntry, setEditingLogEntry] = useState<{ id: string; text: string } | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [logImageFile, setLogImageFile] = useState<File | null>(null);
  const [logImagePreview, setLogImagePreview] = useState<string | null>(null);
  const [uploadingLogImg, setUploadingLogImg] = useState(false);
  const [showDateEdit, setShowDateEdit] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showYarnPicker, setShowYarnPicker] = useState(false);
  const [showNeedlePicker, setShowNeedlePicker] = useState(false);
  const [showCounterAdd, setShowCounterAdd] = useState(false);
  const [newCounterLabel, setNewCounterLabel] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showHeroLightbox, setShowHeroLightbox] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const coverImgInputRef = useRef<HTMLInputElement>(null);
  const logImgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editedProject.currentTimeLog?.startTime && !editedProject.currentTimeLog.endTime) {
      const interval = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [editedProject.currentTimeLog]);

  useEffect(() => {
    if (!showHeroLightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHeroLightbox(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showHeroLightbox]);

  const debouncedOnUpdate = useDebouncedCallback((updated: KnittingProject) => onUpdate(updated), 500);

  const handleUpdate = (updates: Partial<KnittingProject>) => {
    const updated = { ...editedProject, ...updates };
    setEditedProject(updated);
    onUpdate(updated);
  };

  const handleDebouncedUpdate = useCallback((updates: Partial<KnittingProject>) => {
    setEditedProject(prev => {
      const updated = { ...prev, ...updates };
      debouncedOnUpdate(updated);
      return updated;
    });
  }, [debouncedOnUpdate]);

  const handleToggleTimer = () => {
    if (editedProject.currentTimeLog?.startTime && !editedProject.currentTimeLog.endTime) {
      const startTime = new Date(editedProject.currentTimeLog.startTime);
      const minutesElapsed = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
      handleUpdate({ timeSpentMinutes: (editedProject.timeSpentMinutes || 0) + minutesElapsed, currentTimeLog: undefined });
      toast.success(`${minutesElapsed} minutter lagt til`);
    } else {
      handleUpdate({ currentTimeLog: { startTime: new Date() } });
      toast.success('Tidtaker startet');
    }
  };

  const getTimerDisplay = () => {
    if (!editedProject.currentTimeLog?.startTime) return null;
    const elapsed = Math.floor((currentTime.getTime() - new Date(editedProject.currentTimeLog.startTime).getTime()) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      handleUpdate({ pattern: { ...editedProject.pattern, pdfUrl: url, pdfName: file.name } });
      toast.success('Oppskrift lastet opp');
    } catch { toast.error('Kunne ikke laste opp oppskrift'); }
    finally { setUploadingPdf(false); e.target.value = ''; }
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      handleUpdate({ images: [url, ...editedProject.images] });
      toast.success('Bilde lastet opp');
    } catch { toast.error('Kunne ikke laste opp bilde'); }
    finally { setUploadingImg(false); e.target.value = ''; }
  };

  const handleCoverImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      handleUpdate({ images: [url, ...editedProject.images.slice(1)] });
      toast.success('Forsidebilde oppdatert');
    } catch { toast.error('Kunne ikke laste opp bilde'); }
    finally { setUploadingImg(false); e.target.value = ''; }
  };

  const handleLogImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logImagePreview) URL.revokeObjectURL(logImagePreview);
    setLogImageFile(file);
    setLogImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleDeleteLogEntry = () => {
    if (!deleteLogEntryId) return;
    handleUpdate({ logEntries: (editedProject.logEntries || []).filter(e => e.id !== deleteLogEntryId) });
    setDeleteLogEntryId(null);
  };

  const handleSaveEditLogEntry = () => {
    if (!editingLogEntry) return;
    const trimmed = editingLogEntry.text.trim();
    if (!trimmed) return;
    handleUpdate({
      logEntries: (editedProject.logEntries || []).map(e =>
        e.id === editingLogEntry.id ? { ...e, text: trimmed } : e
      ),
    });
    setEditingLogEntry(null);
  };

  const handleAddNote = async () => {
    const trimmedText = noteInput.trim();
    if (!trimmedText && !logImageFile) return;
    setUploadingLogImg(true);
    try {
      let imageUrl: string | undefined;
      if (logImageFile) {
        imageUrl = await api.uploadImage(logImageFile, accessToken);
      }
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        ...(trimmedText ? { text: trimmedText } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        timestamp: new Date(),
      };
      handleUpdate({ logEntries: [entry, ...(editedProject.logEntries || [])] });
      setNoteInput('');
      setLogImageFile(null);
      if (logImagePreview) { URL.revokeObjectURL(logImagePreview); setLogImagePreview(null); }
    } catch { toast.error('Kunne ikke laste opp bilde'); }
    finally { setUploadingLogImg(false); }
  };

  const handleAddCounter = () => {
    if (!newCounterLabel.trim()) return;
    const counter: Counter = { id: crypto.randomUUID(), label: newCounterLabel.trim(), count: 0 };
    handleUpdate({ counters: [...(editedProject.counters || []), counter] });
    setNewCounterLabel('');
    setShowCounterAdd(false);
  };

  const handleCounterChange = (id: string, delta: number) => {
    handleUpdate({
      counters: (editedProject.counters || []).map(c =>
        c.id === id ? { ...c, previousCount: c.count, count: Math.max(0, c.count + delta) } : c
      ),
    });
  };

  const handleCounterUndo = (id: string) => {
    handleUpdate({
      counters: (editedProject.counters || []).map(c =>
        c.id === id && c.previousCount !== undefined ? { ...c, count: c.previousCount, previousCount: undefined } : c
      ),
    });
  };

  const handleAddYarn = (yarn: Yarn) => {
    const newYarn: Yarn = { ...yarn, id: crypto.randomUUID(), standaloneYarnId: yarn.id };
    handleUpdate({ yarns: [...editedProject.yarns, newYarn] });
    setShowYarnPicker(false);
    toast.success(`${yarn.name} lagt til`);
  };

  const handleAddNeedle = (needle: NeedleInventoryItem) => {
    const newNeedle = { id: crypto.randomUUID(), size: needle.size, type: needle.type, length: needle.length, material: needle.material, inventoryNeedleId: needle.id };
    handleUpdate({ needles: [...(editedProject.needles || []), newNeedle] });
    setShowNeedlePicker(false);
    toast.success(`Pinne ${needle.size} lagt til`);
  };

  const openDateEdit = () => {
    setDateStart(editedProject.startDate ? format(new Date(editedProject.startDate), 'yyyy-MM-dd') : '');
    setDateEnd(editedProject.endDate ? format(new Date(editedProject.endDate), 'yyyy-MM-dd') : '');
    setShowDateEdit(true);
  };

  const handleSaveDates = () => {
    handleUpdate({
      startDate: dateStart ? new Date(dateStart) : undefined,
      endDate: dateEnd ? new Date(dateEnd) : undefined,
    });
    setShowDateEdit(false);
  };

  const isTimerRunning = !!(editedProject.currentTimeLog?.startTime && !editedProject.currentTimeLog.endTime);
  const totalMins = editedProject.timeSpentMinutes || 0;
  const displayHrs = Math.floor(totalMins / 60);
  const displayMins = totalMins % 60;
  const heroImage = editedProject.images[0];
  const availableYarns = standaloneYarns.filter(y => !editedProject.yarns.some(ey => ey.standaloneYarnId === y.id));
  const availableNeedles = needleInventory.filter(n => !(editedProject.needles || []).some(en => en.inventoryNeedleId === n.id));

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' } as React.CSSProperties}>

      {/* HERO */}
      <div style={{ position: 'relative', height: 300, background: 'var(--accent)', flexShrink: 0 }}>
        {heroImage
          ? <img src={heroImage} alt={editedProject.name} onClick={() => setShowHeroLightbox(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
          : <KnitTexture variant={paletteForId(editedProject.id)} style={{ position: 'absolute', inset: 0 }} />
        }
        <input ref={coverImgInputRef} type="file" accept="image/*" onChange={handleCoverImgUpload} style={{ display: 'none' }} />
        {/* top bar overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'calc(8px + env(safe-area-inset-top))', paddingBottom: '8px', paddingLeft: '14px', paddingRight: '14px' }}>
          <button onClick={() => onBack()} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'color-mix(in oklab, var(--bg) 85%, transparent)', backdropFilter: 'blur(12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)' }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <button onClick={() => setShowMoreMenu(true)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'color-mix(in oklab, var(--bg) 85%, transparent)', backdropFilter: 'blur(12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)' }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>
        {/* camera button to change cover image */}
        <button
          onClick={() => coverImgInputRef.current?.click()}
          disabled={uploadingImg}
          title="Endre forsidebilde"
          style={{ position: 'absolute', bottom: 12, right: 12, width: 34, height: 34, borderRadius: 10, border: 'none', background: 'color-mix(in oklab, var(--bg) 85%, transparent)', backdropFilter: 'blur(12px)', cursor: uploadingImg ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)', opacity: uploadingImg ? 0.5 : 1 }}
        >
          {uploadingImg
            ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
            : <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          }
        </button>
        {/* status + category chips */}
        <div style={{ position: 'absolute', top: 'calc(60px + env(safe-area-inset-top))', left: 20, display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowStatusMenu(v => !v)} style={{
              height: 28, padding: '0 12px 0 10px', borderRadius: 999, border: 'none',
              background: 'color-mix(in oklab, var(--bg) 92%, transparent)',
              color: 'var(--fg)', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
              backdropFilter: 'blur(12px)',
            }}>
              <StatusDot status={editedProject.status} />
              {editedProject.status}
              <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {showStatusMenu && (
              <>
                <div onClick={() => setShowStatusMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                <div style={{ position: 'absolute', top: 34, left: 0, zIndex: 51, minWidth: 160, padding: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 28px -8px color-mix(in oklab, var(--fg) 30%, transparent)' }}>
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => {
                      const updates: Partial<KnittingProject> = { status: s };
                      if (s === 'Fullført' && editedProject.progress < 100) {
                        updates.progress = 100;
                        updates.endDate = new Date();
                      }
                      handleUpdate(updates);
                      if (s === 'Fullført' && editedProject.progress < 100) {
                        toast.success('Gratulerer! Prosjektet er fullført! 🎉');
                      }
                      setShowStatusMenu(false);
                    }} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 10px', borderRadius: 8, border: 'none',
                      background: editedProject.status === s ? 'var(--accent)' : 'transparent',
                      color: 'var(--fg)', fontSize: 12.5, fontWeight: editedProject.status === s ? 600 : 500,
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    }}>
                      <StatusDot status={s} /> {s}
                      {editedProject.status === s && <span style={{ marginLeft: 'auto', opacity: 0.6 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {editedProject.category && (
            <div style={{
              height: 26, padding: '0 10px', borderRadius: 999,
              background: 'color-mix(in oklab, var(--bg) 88%, transparent)',
              color: 'var(--muted-fg)', fontSize: 11, fontWeight: 500,
              display: 'flex', alignItems: 'center', backdropFilter: 'blur(12px)',
            }}>{editedProject.category}</div>
          )}
          {/* craft type toggle */}
          {(['Strikking', 'Hekling'] as CraftType[]).map(ct => (
            <button key={ct} onClick={() => handleUpdate({ craftType: ct })} style={{
              height: 26, padding: '0 10px', borderRadius: 999, border: 'none',
              background: (editedProject.craftType ?? 'Strikking') === ct
                ? 'color-mix(in oklab, var(--primary) 85%, transparent)'
                : 'color-mix(in oklab, var(--bg) 88%, transparent)',
              color: (editedProject.craftType ?? 'Strikking') === ct ? 'var(--primary-foreground)' : 'var(--muted-fg)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              backdropFilter: 'blur(12px)',
            }}>{ct}</button>
          ))}
        </div>
      </div>

      {/* HEADLINE + DATE */}
      <div style={{ padding: '18px 20px 6px' }}>
        <input
          value={editedProject.name}
          onChange={e => handleDebouncedUpdate({ name: e.target.value })}
          style={{
            width: '100%', border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, letterSpacing: -0.6,
            lineHeight: 1.1, color: 'var(--fg)', padding: 0,
          }}
        />
        {showDateEdit ? (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
                style={{ flex: 1, height: 38, padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
              <span style={{ color: 'var(--muted-fg)', fontSize: 13 }}>→</span>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                style={{ flex: 1, height: 38, padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveDates} style={{ flex: 1, height: 36, borderRadius: 10, border: 'none', background: 'var(--fg)', color: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Ferdig</button>
              <button onClick={() => setShowDateEdit(false)} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Avbryt</button>
            </div>
          </div>
        ) : (editedProject.startDate || editedProject.endDate) ? (
          <button onClick={openDateEdit} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--muted-fg)', fontSize: 12.5, fontFamily: 'inherit' }}>
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            {editedProject.startDate && format(new Date(editedProject.startDate), 'd. MMM yyyy', { locale: nb })}
            {editedProject.endDate && ` → ${format(new Date(editedProject.endDate), 'd. MMM yyyy', { locale: nb })}`}
          </button>
        ) : (
          <button onClick={openDateEdit} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)', fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit' }}>
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Legg til dato
          </button>
        )}
      </div>

      {/* RECIPE */}
      <div style={{ padding: '8px 20px' }}>
        <input ref={pdfInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp" onChange={handlePdfUpload} style={{ display: 'none' }} />
        {editedProject.pattern?.pdfUrl ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => window.open(editedProject.pattern!.pdfUrl!, '_blank')} style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
              padding: 16, paddingRight: 52, borderRadius: 18, border: '1px solid var(--fg)',
              background: 'var(--fg)', color: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <div style={{ width: 54, height: 66, borderRadius: 6, background: 'color-mix(in oklab, var(--bg) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 8, fontWeight: 700, background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 4, padding: '2px 4px' }}>{editedProject.pattern.pdfName?.split('.').pop()?.toUpperCase().slice(0, 4) || 'FIL'}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.6 }}>Oppskrift</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {editedProject.pattern.pdfName || editedProject.pattern.name || 'Oppskrift'}
                </div>
                {editedProject.pattern.designer && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>{editedProject.pattern.designer}</div>}
              </div>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button
              onClick={() => setShowRemoveRecipeDialog(true)}
              style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 10, border: 'none', background: 'color-mix(in oklab, var(--bg) 18%, transparent)', color: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Fjern oppskrift"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px dashed var(--border)', borderRadius: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-fg)', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Ingen oppskrift lagt ved</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>Last opp oppskrift (PDF, Word, bilde)</div>
            </div>
            <button onClick={() => pdfInputRef.current?.click()} disabled={uploadingPdf} style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: 'var(--fg)', color: 'var(--bg)', cursor: uploadingPdf ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', opacity: uploadingPdf ? 0.5 : 1, flexShrink: 0 }}>
              {uploadingPdf ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : '+ Last opp'}
            </button>
          </div>
        )}
      </div>

      {/* PROGRESS */}
      <div style={{ padding: '4px 20px 8px' }}>
        <div style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', letterSpacing: 1.3, textTransform: 'uppercase', fontWeight: 500 }}>Progresjon</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1.2, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {editedProject.progress}<span style={{ fontSize: 18, opacity: 0.5, marginLeft: 2 }}>%</span>
              </div>
              {totalMins > 0 && (
                <div style={{ fontSize: 12, color: 'var(--muted-fg)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ·
                  <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {displayHrs}t{displayMins > 0 ? ` ${displayMins}min` : ''}
                </div>
              )}
            </div>
            <div style={{ marginTop: 10, height: 4, background: 'var(--accent)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: editedProject.progress + '%', height: '100%', background: 'var(--primary)', transition: 'width .3s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => handleDebouncedUpdate({ progress: Math.min(100, editedProject.progress + 5) })} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button onClick={() => handleDebouncedUpdate({ progress: Math.max(0, editedProject.progress - 5) })} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* TIMER */}
      <div style={{ padding: '4px 20px 8px' }}>
        <button onClick={handleToggleTimer} style={{
          width: '100%', height: 48, borderRadius: 14, border: '1px solid var(--border)',
          background: isTimerRunning ? 'var(--primary)' : 'var(--card)',
          color: isTimerRunning ? 'var(--primary-foreground)' : 'var(--fg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
        }}>
          {isTimerRunning ? (
            <>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--primary-foreground)' }} />
              Stopp økt · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{getTimerDisplay()}</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
              Start økt
            </>
          )}
        </button>
      </div>

      {/* COUNTERS */}
      <Section title="Teller" count={(editedProject.counters || []).length}>
        {(editedProject.counters || []).map(c => (
          <div key={c.id} style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500 }}>{c.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{c.count}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {c.previousCount !== undefined && (
                <button onClick={() => handleCounterUndo(c.id)} title="Angre" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>↩</button>
              )}
              <button onClick={() => handleCounterChange(c.id, -1)} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
              </button>
              <button onClick={() => handleCounterChange(c.id, 1)} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--fg)', color: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>
        ))}
        {showCounterAdd ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus
              placeholder="Navn på teller"
              value={newCounterLabel}
              onChange={e => setNewCounterLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCounter(); if (e.key === 'Escape') { setShowCounterAdd(false); setNewCounterLabel(''); } }}
              style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
            />
            <button onClick={handleAddCounter} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Legg til</button>
            <button onClick={() => { setShowCounterAdd(false); setNewCounterLabel(''); }} style={{ height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowCounterAdd(true)} style={dashedBtn}>+ Legg til teller</button>
        )}
      </Section>

      {/* YARN */}
      <Section title="Garn" count={editedProject.yarns.length}>
        {editedProject.yarns.map(y => (
          <div key={y.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
            {y.color && <div style={{ width: 28, height: 28, borderRadius: 999, background: y.color, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{y.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', marginTop: 1 }}>{[y.brand, y.color, y.weight].filter(Boolean).join(' · ')}</div>
            </div>
            {y.amount && <div style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{y.amount}</div>}
          </div>
        ))}
        <button onClick={() => setShowYarnPicker(true)} style={dashedBtn}>+ Legg til garn</button>
      </Section>

      {/* NEEDLES */}
      <Section title={editedProject.craftType === 'Hekling' ? 'Heklenåler' : 'Pinner'} count={(editedProject.needles || []).length}>
        {(editedProject.needles || []).map(n => (
          <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l6-6M8 16l8-8 5-5-1 5-8 8z"/><circle cx="6.5" cy="17.5" r="1"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{n.size} · {n.type}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', marginTop: 1 }}>{[n.material, n.length].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
        ))}
        <button onClick={() => setShowNeedlePicker(true)} style={dashedBtn}>
          {editedProject.craftType === 'Hekling' ? '+ Legg til heklenål' : '+ Legg til pinne'}
        </button>
      </Section>

      {/* GAUGE */}
      {(editedProject.gauge?.stitchesPer10cm || editedProject.gauge?.rowsPer10cm || editedProject.gauge?.needleSize) && (
        <Section title="Strikkefasthet">
          <div style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, letterSpacing: -0.2 }}>
              {[
                editedProject.gauge?.stitchesPer10cm && `${editedProject.gauge.stitchesPer10cm} m/10cm`,
                editedProject.gauge?.rowsPer10cm && `${editedProject.gauge.rowsPer10cm} omg/10cm`,
                editedProject.gauge?.needleSize && `pinne ${editedProject.gauge.needleSize}`,
              ].filter(Boolean).join(' · ')}
            </div>
            {editedProject.gauge?.notes && <div style={{ fontSize: 12.5, color: 'var(--muted-fg)', marginTop: 4 }}>{editedProject.gauge.notes}</div>}
          </div>
        </Section>
      )}

      {/* NOTES (static) */}
      {editedProject.notes && (
        <Section title="Notater">
          <div style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.55 }}>
            {editedProject.notes}
          </div>
        </Section>
      )}

      {/* LOG ENTRIES + INPUT */}
      <div style={{ padding: '14px 20px 2px' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500, padding: '0 2px 10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span>Logg</span>
          {(editedProject.logEntries || []).length > 0 && (
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{editedProject.logEntries!.length}</span>
          )}
        </div>

        {(editedProject.logEntries || []).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {(editedProject.logEntries || []).map(e => {
              const isEditing = editingLogEntry?.id === e.id;
              return (
                <div key={e.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                  {e.imageUrl && (
                    <img
                      src={e.imageUrl}
                      alt=""
                      style={{ display: 'block', width: '100%', maxHeight: 280, objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '10px 14px', paddingRight: e.text ? 64 : 64 }}>
                    {isEditing ? (
                      <>
                        <textarea
                          autoFocus
                          value={editingLogEntry!.text}
                          onChange={ev => setEditingLogEntry({ id: e.id, text: ev.target.value })}
                          onKeyDown={ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); handleSaveEditLogEntry(); } if (ev.key === 'Escape') setEditingLogEntry(null); }}
                          style={{ width: '100%', minHeight: 72, resize: 'vertical', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.5, padding: '6px 10px', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingLogEntry(null)} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Avbryt</button>
                          <button onClick={handleSaveEditLogEntry} disabled={!editingLogEntry!.text.trim()} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: 'none', background: 'var(--fg)', color: 'var(--bg)', cursor: !editingLogEntry!.text.trim() ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, opacity: !editingLogEntry!.text.trim() ? 0.4 : 1 }}>Lagre</button>
                        </div>
                      </>
                    ) : (
                      <>
                        {e.text && <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{e.text}</div>}
                        <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: e.text ? 4 : 0 }}>
                          {format(new Date(e.timestamp), 'd. MMM yyyy, HH:mm', { locale: nb })}
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 2 }}>
                      {e.text && (
                        <button
                          onClick={() => setEditingLogEntry({ id: e.id, text: e.text! })}
                          style={{ width: 26, height: 26, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}
                          onMouseEnter={ev => (ev.currentTarget.style.opacity = '1')}
                          onMouseLeave={ev => (ev.currentTarget.style.opacity = '0.5')}
                          aria-label="Rediger notat"
                          title="Rediger notat"
                        >
                          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteLogEntryId(e.id)}
                        style={{ width: 26, height: 26, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1, opacity: 0.5 }}
                        onMouseEnter={ev => (ev.currentTarget.style.opacity = '1')}
                        onMouseLeave={ev => (ev.currentTarget.style.opacity = '0.5')}
                        aria-label="Slett notat"
                        title="Slett notat"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {logImagePreview && (
          <div style={{ position: 'relative', marginBottom: 8, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img
              src={logImagePreview}
              alt="Forhåndsvisning"
              style={{ display: 'block', width: '100%', maxHeight: 200, objectFit: 'cover' }}
            />
            <button
              onClick={() => { if (logImagePreview) URL.revokeObjectURL(logImagePreview); setLogImagePreview(null); setLogImageFile(null); }}
              style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 999, border: 'none', background: 'color-mix(in oklab, #000 55%, transparent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}
              aria-label="Fjern bilde"
            >
              ×
            </button>
          </div>
        )}

        <input ref={logImgInputRef} type="file" accept="image/*" onChange={handleLogImageSelect} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => logImgInputRef.current?.click()}
            disabled={uploadingLogImg}
            style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: logImageFile ? 'var(--accent)' : 'var(--card)', color: logImageFile ? 'var(--fg)' : 'var(--muted-fg)', cursor: uploadingLogImg ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: uploadingLogImg ? 0.5 : 1 }}
            aria-label="Legg ved bilde"
            title="Legg ved bilde"
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          <input
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !uploadingLogImg) { e.preventDefault(); handleAddNote(); } }}
            placeholder="Logg en notis..."
            style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
          />
          <button
            onClick={handleAddNote}
            disabled={uploadingLogImg || (!noteInput.trim() && !logImageFile)}
            style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', cursor: (uploadingLogImg || (!noteInput.trim() && !logImageFile)) ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, opacity: (uploadingLogImg || (!noteInput.trim() && !logImageFile)) ? 0.35 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {uploadingLogImg && <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />}
            Send
          </button>
        </div>
      </div>

      {/* IMAGE UPLOAD */}
      <div style={{ padding: '8px 20px 20px' }}>
        <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImgUpload} style={{ display: 'none' }} />
        <button onClick={() => imgInputRef.current?.click()} disabled={uploadingImg} style={{ ...dashedBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: uploadingImg ? 0.5 : 1 }}>
          {uploadingImg ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : (
            <>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Last opp bilde
            </>
          )}
        </button>
      </div>

      {/* MORE MENU */}
      {showMoreMenu && (
        <>
          <div onClick={() => setShowMoreMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'color-mix(in oklab, #000 25%, transparent)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 51, background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '12px 20px 36px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '0 auto 18px' }} />
            <button onClick={() => { setShowMoreMenu(false); coverImgInputRef.current?.click(); }} style={{ width: '100%', height: 48, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              {heroImage ? 'Endre forsidebilde' : 'Legg til forsidebilde'}
            </button>
            {heroImage && (
              <button onClick={() => { handleUpdate({ images: editedProject.images.slice(1) }); setShowMoreMenu(false); toast.success('Forsidebilde fjernet'); }} style={{ width: '100%', height: 48, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Fjern forsidebilde
              </button>
            )}
            <button onClick={() => { setShowMoreMenu(false); pdfInputRef.current?.click(); }} style={{ width: '100%', height: 48, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              {editedProject.pattern?.pdfUrl ? 'Bytt oppskrift' : 'Legg til oppskrift'}
            </button>
            {editedProject.pattern?.pdfUrl && (
              <button onClick={() => { handleUpdate({ pattern: { ...editedProject.pattern, pdfUrl: undefined, pdfName: undefined } }); setShowMoreMenu(false); toast.success('Oppskrift fjernet'); }} style={{ width: '100%', height: 48, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Fjern oppskrift
              </button>
            )}
            <button onClick={() => { setShowMoreMenu(false); setShowDeleteDialog(true); }} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: 'transparent', color: '#c9856b', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
              Slett prosjekt…
            </button>
          </div>
        </>
      )}

      {/* YARN PICKER */}
      {showYarnPicker && (
        <>
          <div onClick={() => setShowYarnPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'color-mix(in oklab, #000 25%, transparent)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 51, background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '12px 20px 36px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '0 auto 18px' }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Velg garn</div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableYarns.map(yarn => (
                <button key={yarn.id} onClick={() => handleAddYarn(yarn)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                  {yarn.color && <div style={{ width: 28, height: 28, borderRadius: 999, background: yarn.color, flexShrink: 0, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{yarn.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{[yarn.brand, yarn.weight].filter(Boolean).join(' · ')}</div>
                  </div>
                </button>
              ))}
              {availableYarns.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--muted-fg)', fontSize: 14, padding: '24px 0' }}>Ingen garn tilgjengelig i lager</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* NEEDLE PICKER */}
      {showNeedlePicker && (
        <>
          <div onClick={() => setShowNeedlePicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'color-mix(in oklab, #000 25%, transparent)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 51, background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '12px 20px 36px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '0 auto 18px' }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{editedProject.craftType === 'Hekling' ? 'Velg heklenål' : 'Velg pinne'}</div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableNeedles.map(needle => (
                <button key={needle.id} onClick={() => handleAddNeedle(needle)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l6-6M8 16l8-8 5-5-1 5-8 8z"/><circle cx="6.5" cy="17.5" r="1"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{needle.size} · {needle.type}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{[needle.material, needle.length].filter(Boolean).join(' · ')}</div>
                  </div>
                  {needle.quantity > 1 && <div style={{ fontSize: 12, color: 'var(--muted-fg)', flexShrink: 0 }}>×{needle.quantity}</div>}
                </button>
              ))}
              {availableNeedles.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--muted-fg)', fontSize: 14, padding: '24px 0' }}>
                  {editedProject.craftType === 'Hekling' ? 'Ingen heklenåler tilgjengelig i lager' : 'Ingen pinner tilgjengelig i lager'}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* DELETE LOG ENTRY DIALOG */}
      <AlertDialog open={!!deleteLogEntryId} onOpenChange={open => { if (!open) setDeleteLogEntryId(null); }}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Slett notat?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette notatet vil bli slettet permanent. Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1">Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLogEntry} className="flex-1 bg-destructive hover:bg-destructive/90">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Slett prosjektet?</AlertDialogTitle>
            <AlertDialogDescription>
              "{project.name}" vil bli slettet permanent. Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleUpdate({ status: 'Arkivert' as ProjectStatus })} className="bg-zinc-600 hover:bg-zinc-700">
              Arkiver
            </AlertDialogAction>
            <AlertDialogAction onClick={() => onDelete(project.id)} className="bg-destructive hover:bg-destructive/90">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* REMOVE RECIPE DIALOG */}
      <AlertDialog open={showRemoveRecipeDialog} onOpenChange={setShowRemoveRecipeDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern oppskriften?</AlertDialogTitle>
            <AlertDialogDescription>
              Oppskriftsfilen vil bli fjernet fra prosjektet. Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleUpdate({ pattern: { ...editedProject.pattern, pdfUrl: undefined, pdfName: undefined } });
                toast.success('Oppskrift fjernet');
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Fjern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showHeroLightbox && heroImage && (
        <div
          onClick={() => setShowHeroLightbox(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'color-mix(in oklab, #000 88%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img
            src={heroImage}
            alt={editedProject.name}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6, boxShadow: '0 24px 64px -12px rgba(0,0,0,0.7)' }}
          />
          <button
            onClick={() => setShowHeroLightbox(false)}
            aria-label="Lukk"
            style={{
              position: 'absolute',
              top: 'calc(16px + env(safe-area-inset-top))', right: 16,
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: 'color-mix(in oklab, var(--bg) 85%, transparent)',
              backdropFilter: 'blur(12px)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--fg)', zIndex: 101,
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
