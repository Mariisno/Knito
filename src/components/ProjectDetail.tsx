import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react@8.6.0';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import type { KnittingProject, ProjectStatus, CraftType, Counter, LogEntry, NeedleInventoryItem, Yarn } from '../types/knitting';
import { getAllNeedleAvailability } from '../utils/needles';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import * as api from '../utils/api';
import { KnitTexture, paletteForId } from './KnitTexture';
import { YarnFormFields } from './YarnFormFields';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ProjectDetailProps {
  project: KnittingProject;
  projects: KnittingProject[];
  onBack: (tab?: string) => void;
  onUpdate: (project: KnittingProject) => void;
  onDelete: (projectId: string) => void;
  accessToken: string;
  needleInventory: NeedleInventoryItem[];
  standaloneYarns: Yarn[];
  onUpdateStandaloneYarns: (yarns: Yarn[]) => void;
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

const needleFieldLabel: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: 'var(--muted-fg)', marginBottom: 6,
};

const needleFieldInput: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
  border: '1px solid var(--border)', background: 'var(--card)',
  color: 'var(--fg)', fontFamily: 'inherit', fontSize: 14, outline: 'none',
};

export function ProjectDetail({ project, projects, onBack, onUpdate, onDelete, accessToken, needleInventory, standaloneYarns, onUpdateStandaloneYarns }: ProjectDetailProps) {
  const [editedProject, setEditedProject] = useState(project);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLogEntryId, setDeleteLogEntryId] = useState<string | null>(null);
  const [editingLogEntry, setEditingLogEntry] = useState<{ id: string; text: string } | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [editingPatternUrl, setEditingPatternUrl] = useState(false);
  const [patternUrlDraft, setPatternUrlDraft] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [logImageFile, setLogImageFile] = useState<File | null>(null);
  const [logImagePreview, setLogImagePreview] = useState<string | null>(null);
  const [uploadingLogImg, setUploadingLogImg] = useState(false);
  const [showDateEdit, setShowDateEdit] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showYarnPicker, setShowYarnPicker] = useState(false);
  const [showNewYarnForm, setShowNewYarnForm] = useState(false);
  const [newYarnData, setNewYarnData] = useState<Partial<Yarn>>({});
  const [pendingYarn, setPendingYarn] = useState<Yarn | null>(null);
  const [pendingYarnAmount, setPendingYarnAmount] = useState('');
  const [showNeedlePicker, setShowNeedlePicker] = useState(false);
  const [showNewNeedleForm, setShowNewNeedleForm] = useState(false);
  const [newNeedleData, setNewNeedleData] = useState<{ type?: string; size?: string; length?: string; material?: string }>({ type: 'Rundpinne' });
  const [showCounterAdd, setShowCounterAdd] = useState(false);
  const [newCounterLabel, setNewCounterLabel] = useState('');
  const [counterInputValues, setCounterInputValues] = useState<Record<string, string>>({});
  const [showHeroLightbox, setShowHeroLightbox] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const coverImgInputRef = useRef<HTMLInputElement>(null);
  const logImgInputRef = useRef<HTMLInputElement>(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentImgIdx(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    const clamped = Math.min(currentImgIdx, Math.max(0, editedProject.images.length - 1));
    emblaApi.scrollTo(clamped, true);
    setCurrentImgIdx(clamped);
  }, [editedProject.images.length]);

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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      const existing = editedProject.pattern?.files ?? [];
      handleUpdate({ pattern: { ...editedProject.pattern, files: [...existing, { url, name: file.name }] } });
      toast.success('Oppskrift lastet opp');
    } catch { toast.error('Kunne ikke laste opp oppskrift'); }
    finally { setUploadingPdf(false); e.target.value = ''; }
  };

  const handleDeletePatternFile = (fileUrl: string) => {
    if (editedProject.pattern?.pdfUrl === fileUrl) {
      handleUpdate({ pattern: { ...editedProject.pattern, pdfUrl: undefined, pdfName: undefined } });
    } else {
      const updated = (editedProject.pattern?.files ?? []).filter(f => f.url !== fileUrl);
      handleUpdate({ pattern: { ...editedProject.pattern, files: updated } });
    }
    toast.success('Oppskrift fjernet');
  };

  const normalizePatternUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const prettyHost = (raw: string): string => {
    try {
      return new URL(normalizePatternUrl(raw)).hostname.replace(/^www\./, '');
    } catch {
      return raw;
    }
  };

  const startEditPatternUrl = () => {
    setPatternUrlDraft(editedProject.pattern?.url ?? '');
    setEditingPatternUrl(true);
  };

  const handleSavePatternUrl = () => {
    const next = patternUrlDraft.trim();
    handleUpdate({
      pattern: {
        ...editedProject.pattern,
        url: next ? normalizePatternUrl(next) : undefined,
      },
    });
    setEditingPatternUrl(false);
  };

  const handleDeletePatternUrl = () => {
    handleUpdate({ pattern: { ...editedProject.pattern, url: undefined } });
    toast.success('Lenke fjernet');
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImg(true);
    try {
      const urls = await Promise.all(files.map(f => api.uploadImage(f, accessToken)));
      handleUpdate({ images: [...urls, ...editedProject.images] });
      toast.success(urls.length === 1 ? 'Bilde lastet opp' : `${urls.length} bilder lastet opp`);
    } catch { toast.error('Kunne ikke laste opp bilde'); }
    finally { setUploadingImg(false); e.target.value = ''; }
  };

  const handleCoverImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      handleUpdate({
        images: editedProject.images.length === 0
          ? [url]
          : editedProject.images.map((img, i) => i === currentImgIdx ? url : img),
      });
      toast.success('Bilde oppdatert');
    } catch { toast.error('Kunne ikke laste opp bilde'); }
    finally { setUploadingImg(false); e.target.value = ''; }
  };

  const handleDeleteImg = (index: number) => {
    const newImages = editedProject.images.filter((_, i) => i !== index);
    handleUpdate({ images: newImages });
    toast.success('Bilde fjernet');
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
        c.id === id ? { ...c, count: Math.max(0, c.count + delta) } : c
      ),
    });
  };

  const handleCounterDelete = (id: string) => {
    handleUpdate({
      counters: (editedProject.counters || []).filter(c => c.id !== id),
    });
  };

  const handleCounterSetValue = (id: string, value: number) => {
    handleUpdate({
      counters: (editedProject.counters || []).map(c =>
        c.id === id ? { ...c, count: Math.max(0, value) } : c
      ),
    });
  };

  const handleAddYarn = (yarn: Yarn, amount?: string) => {
    const { id: _id, quantity: _q, price: _p, standaloneYarnId: _s, ...shared } = yarn;
    const newYarn: Yarn = {
      ...shared,
      id: crypto.randomUUID(),
      standaloneYarnId: yarn.id,
      amount: amount?.trim() || yarn.amount,
    };
    handleUpdate({ yarns: [...editedProject.yarns, newYarn] });
    setShowYarnPicker(false);
    setPendingYarn(null);
    setPendingYarnAmount('');
    toast.success(`${yarn.name} lagt til`);
  };

  const handleAddNewYarn = () => {
    if (!newYarnData.name?.trim()) return;
    const inventoryYarn: Yarn = {
      id: crypto.randomUUID(),
      name: newYarnData.name.trim(),
      brand: newYarnData.brand?.trim() || undefined,
      color: newYarnData.color?.trim() || undefined,
      amount: newYarnData.amount?.trim() || undefined,
      weight: newYarnData.weight || undefined,
      quantity: newYarnData.quantity ?? 1,
      fiberContent: newYarnData.fiberContent?.trim() || undefined,
      yardage: newYarnData.yardage?.trim() || undefined,
      dyeLot: newYarnData.dyeLot?.trim() || undefined,
      price: newYarnData.price,
      notes: newYarnData.notes?.trim() || undefined,
      imageUrl: newYarnData.imageUrl,
    };
    const projectYarn: Yarn = {
      id: crypto.randomUUID(),
      standaloneYarnId: inventoryYarn.id,
      name: inventoryYarn.name,
      brand: inventoryYarn.brand,
      color: inventoryYarn.color,
      amount: inventoryYarn.amount,
      weight: inventoryYarn.weight,
      fiberContent: inventoryYarn.fiberContent,
      yardage: inventoryYarn.yardage,
      dyeLot: inventoryYarn.dyeLot,
      notes: inventoryYarn.notes,
      imageUrl: inventoryYarn.imageUrl,
    };
    onUpdateStandaloneYarns([...standaloneYarns, inventoryYarn]);
    handleUpdate({ yarns: [...editedProject.yarns, projectYarn] });
    setShowYarnPicker(false);
    setShowNewYarnForm(false);
    setNewYarnData({});
    toast.success(`${projectYarn.name} lagt til`);
  };

  const handleYarnImageUpload = async (file: File, setUrl: (url: string) => void) => {
    if (!accessToken) { toast.error('Du må være logget inn'); return; }
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      setUrl(url);
      toast.success('Bilde lastet opp');
    } catch {
      toast.error('Kunne ikke laste opp bilde');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleAddNeedle = (needle: NeedleInventoryItem) => {
    const newNeedle = { id: crypto.randomUUID(), size: needle.size, type: needle.type, length: needle.length, material: needle.material, inventoryNeedleId: needle.id };
    handleUpdate({ needles: [...(editedProject.needles || []), newNeedle] });
    setShowNeedlePicker(false);
    toast.success(`Pinne ${needle.size} lagt til`);
  };

  const handleAddNewNeedle = () => {
    if (!newNeedleData.size?.trim()) return;
    const needle = {
      id: crypto.randomUUID(),
      size: newNeedleData.size.trim(),
      type: newNeedleData.type || 'Rundpinne',
      length: newNeedleData.length?.trim() || undefined,
      material: newNeedleData.material?.trim() || undefined,
    };
    handleUpdate({ needles: [...(editedProject.needles || []), needle] });
    setShowNeedlePicker(false);
    setShowNewNeedleForm(false);
    setNewNeedleData({ type: 'Rundpinne' });
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

  const heroImage = editedProject.images[0];
  const availableYarns = standaloneYarns.filter(y => !editedProject.yarns.some(ey => ey.standaloneYarnId === y.id));
  const needleAvailability = useMemo(
    () => getAllNeedleAvailability(needleInventory, projects),
    [needleInventory, projects],
  );
  const remainingForOffer = (n: NeedleInventoryItem) => {
    const alreadyInThisProject = (editedProject.needles || []).some(en => en.inventoryNeedleId === n.id);
    if (alreadyInThisProject) return 0;
    const a = needleAvailability.get(n.id);
    return a ? a.availableCount : n.quantity;
  };
  const availableNeedles = needleInventory.filter(n => remainingForOffer(n) > 0);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' } as React.CSSProperties}>

      {/* HERO */}
      <div style={{ position: 'relative', height: 'clamp(220px, 55vw, 320px)', background: 'var(--accent)', flexShrink: 0 }}>
        {editedProject.images.length > 0 ? (
          <div ref={emblaRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: '100%' }}>
              {editedProject.images.map((img, i) => (
                <div key={i} style={{ flex: '0 0 100%', minWidth: 0, height: '100%' }}>
                  <img src={img} alt={`${editedProject.name} ${i + 1}`} onClick={() => setShowHeroLightbox(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <KnitTexture variant={paletteForId(editedProject.id)} style={{ position: 'absolute', inset: 0 }} />
        )}
        <input ref={coverImgInputRef} type="file" accept="image/*" onChange={handleCoverImgUpload} style={{ display: 'none' }} />
        {/* top bar overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'calc(8px + env(safe-area-inset-top))', paddingBottom: '8px', paddingLeft: '14px', paddingRight: '14px' }}>
          <button onClick={() => onBack()} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'color-mix(in oklab, var(--bg) 85%, transparent)', backdropFilter: 'blur(12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)' }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <button onClick={() => setShowMoreMenu(true)} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'color-mix(in oklab, var(--bg) 85%, transparent)', backdropFilter: 'blur(12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)' }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>
        {/* dot indicators */}
        {editedProject.images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 54, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2, pointerEvents: 'none' }}>
            {editedProject.images.map((_, i) => (
              <div key={i} style={{ width: i === currentImgIdx ? 16 : 6, height: 6, borderRadius: 999, background: i === currentImgIdx ? 'white' : 'rgba(255,255,255,0.5)', transition: 'width 0.2s' }} />
            ))}
          </div>
        )}
        {/* delete current image button */}
        {editedProject.images.length > 0 && (
          <button
            onClick={() => handleDeleteImg(currentImgIdx)}
            title="Slett bilde"
            style={{ position: 'absolute', bottom: 12, left: 12, width: 34, height: 34, borderRadius: 10, border: 'none', background: 'color-mix(in oklab, var(--bg) 85%, transparent)', backdropFilter: 'blur(12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg)' }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        )}
        {/* camera button to change current image */}
        <button
          onClick={() => coverImgInputRef.current?.click()}
          disabled={uploadingImg}
          title="Endre bilde"
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
                style={{ flex: 1, minWidth: 0, height: 44, padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
              <span style={{ color: 'var(--muted-fg)', fontSize: 13 }}>→</span>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                style={{ flex: 1, minWidth: 0, height: 44, padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
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
        {(() => {
          const patternFiles = [
            ...(editedProject.pattern?.pdfUrl ? [{ url: editedProject.pattern.pdfUrl, name: editedProject.pattern.pdfName || 'Oppskrift' }] : []),
            ...(editedProject.pattern?.files ?? []),
          ];
          const patternUrl = editedProject.pattern?.url;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {editingPatternUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card)' }}>
                  <input
                    autoFocus
                    type="url"
                    inputMode="url"
                    placeholder="https://garnstudio.com/..."
                    value={patternUrlDraft}
                    onChange={e => setPatternUrlDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleSavePatternUrl(); }
                      if (e.key === 'Escape') { e.preventDefault(); setEditingPatternUrl(false); }
                    }}
                    onBlur={handleSavePatternUrl}
                    style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
                  />
                </div>
              ) : patternUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, border: '1px solid var(--fg)', background: 'var(--fg)', color: 'var(--bg)' }}>
                  <button onClick={() => window.open(normalizePatternUrl(patternUrl), '_blank', 'noopener,noreferrer')} title={patternUrl} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}>
                    <div style={{ width: 36, height: 44, borderRadius: 5, background: 'color-mix(in oklab, var(--bg) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.6 }}>Lenke</div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prettyHost(patternUrl)}</div>
                    </div>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </button>
                  <button onClick={startEditPatternUrl} title="Rediger lenke" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'color-mix(in oklab, var(--bg) 12%, transparent)', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>
                  </button>
                  <button onClick={handleDeletePatternUrl} title="Fjern" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'color-mix(in oklab, var(--bg) 12%, transparent)', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              ) : null}
              {patternFiles.map((pf) => (
                <div key={pf.url} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)' }}>
                  <button onClick={() => window.open(pf.url, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}>
                    <div style={{ width: 36, height: 44, borderRadius: 5, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <div style={{ position: 'absolute', bottom: -3, right: -3, fontSize: 7, fontWeight: 700, background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 3, padding: '1px 3px' }}>{pf.name.split('.').pop()?.toUpperCase().slice(0, 4) || 'FIL'}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.6 }}>Oppskrift</div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pf.name}</div>
                    </div>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </button>
                  <button onClick={() => handleDeletePatternFile(pf.url)} title="Fjern" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              ))}
              <button onClick={() => pdfInputRef.current?.click()} disabled={uploadingPdf} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--primary)', cursor: uploadingPdf ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, opacity: uploadingPdf ? 0.5 : 1 }}>
                {uploadingPdf
                  ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
                  : <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                }
                {patternFiles.length === 0 ? 'Legg til oppskrift' : 'Legg til flere'}
              </button>
              {!patternUrl && !editingPatternUrl && (
                <button onClick={startEditPatternUrl} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>
                  Legg til lenke
                </button>
              )}
            </div>
          );
        })()}
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

      {/* COUNTERS — skjult inntil videre */}
      {false && <Section title="Teller" count={(editedProject.counters || []).length}>
        {(editedProject.counters || []).map(c => (
          <div key={c.id} style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500 }}>{c.label}</div>
              <input
                type="number"
                min="0"
                value={counterInputValues[c.id] ?? String(c.count)}
                onFocus={() => setCounterInputValues(v => ({ ...v, [c.id]: String(c.count) }))}
                onChange={e => setCounterInputValues(v => ({ ...v, [c.id]: e.target.value }))}
                onBlur={() => {
                  const parsed = parseInt(counterInputValues[c.id] ?? '', 10);
                  if (!isNaN(parsed)) handleCounterSetValue(c.id, parsed);
                  setCounterInputValues(v => { const next = { ...v }; delete next[c.id]; return next; });
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') {
                    setCounterInputValues(v => { const next = { ...v }; delete next[c.id]; return next; });
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', border: 'none', background: 'transparent', color: 'var(--fg)', width: '5ch', outline: 'none', padding: 0, MozAppearance: 'textfield' } as React.CSSProperties}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => handleCounterDelete(c.id)} title="Slett teller" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
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
      </Section>}

      {/* YARN */}
      <Section title="Garn" count={editedProject.yarns.length}>
        {editedProject.yarns.map(y => (
          <div key={y.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
            {y.imageUrl ? (
              <img src={y.imageUrl} alt={y.name} style={{ width: 28, height: 28, borderRadius: 999, objectFit: 'cover', flexShrink: 0, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)' }} />
            ) : y.color ? (
              <div style={{ width: 28, height: 28, borderRadius: 999, background: y.color, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)', flexShrink: 0 }} />
            ) : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{y.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', marginTop: 1 }}>{[y.brand, y.color, y.weight].filter(Boolean).join(' · ')}</div>
            </div>
            {y.amount && <div style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{y.amount}</div>}
            <button
              onClick={() => handleUpdate({ yarns: editedProject.yarns.filter(y2 => y2.id !== y.id) })}
              aria-label="Fjern garn"
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>
            </button>
          </div>
        ))}
        <button onClick={() => setShowYarnPicker(true)} style={dashedBtn}>+ Legg til garn</button>
      </Section>

      {/* NEEDLES */}
      <Section title="Pinner" count={(editedProject.needles || []).length}>
        {(editedProject.needles || []).map(n => (
          <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l6-6M8 16l8-8 5-5-1 5-8 8z"/><circle cx="6.5" cy="17.5" r="1"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{n.size} · {n.type}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', marginTop: 1 }}>{[n.material, n.length].filter(Boolean).join(' · ')}</div>
            </div>
            <button
              onClick={() => {
                handleUpdate({ needles: (editedProject.needles || []).filter(n2 => n2.id !== n.id) });
                toast.success('Pinne fjernet');
              }}
              aria-label="Fjern pinne"
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>
            </button>
          </div>
        ))}
        <button onClick={() => setShowNeedlePicker(true)} style={dashedBtn}>+ Legg til pinne</button>
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
                          className="log-entry-action"
                          style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          aria-label="Rediger notat"
                          title="Rediger notat"
                        >
                          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteLogEntryId(e.id)}
                        className="log-entry-action"
                        style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, lineHeight: 1 }}
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
            Lagre
          </button>
        </div>
      </div>

      {/* IMAGE UPLOAD */}
      <div style={{ padding: '8px 20px 20px' }}>
        <input ref={imgInputRef} type="file" accept="image/*" multiple onChange={handleImgUpload} style={{ display: 'none' }} />
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
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--shell-max-w)', zIndex: 51, background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '12px 20px 36px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '0 auto 18px' }} />
            <button onClick={() => { setShowMoreMenu(false); coverImgInputRef.current?.click(); }} style={{ width: '100%', height: 48, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              {heroImage ? 'Endre bilde' : 'Legg til bilde'}
            </button>
            {heroImage && (
              <button onClick={() => { handleDeleteImg(currentImgIdx); setShowMoreMenu(false); }} style={{ width: '100%', height: 48, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Fjern dette bildet
              </button>
            )}
            <button onClick={() => { setShowMoreMenu(false); setShowDeleteDialog(true); }} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
              Slett prosjekt…
            </button>
          </div>
        </>
      )}

      {/* YARN PICKER */}
      {showYarnPicker && (
        <>
          <div onClick={() => { setShowYarnPicker(false); setShowNewYarnForm(false); setNewYarnData({}); setPendingYarn(null); setPendingYarnAmount(''); }} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'color-mix(in oklab, #000 25%, transparent)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--shell-max-w)', zIndex: 51, background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '12px 20px 36px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '0 auto 18px' }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{showNewYarnForm ? 'Nytt garn' : pendingYarn ? 'Legg til mengde' : 'Velg garn'}</div>
            {showNewYarnForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                <YarnFormFields
                  value={newYarnData}
                  onChange={setNewYarnData}
                  uploadingImg={uploadingImg}
                  onUploadImage={handleYarnImageUpload}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={handleAddNewYarn} disabled={!newYarnData.name?.trim() || uploadingImg} style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', cursor: newYarnData.name?.trim() && !uploadingImg ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, opacity: newYarnData.name?.trim() && !uploadingImg ? 1 : 0.35 }}>Legg til</button>
                  <button onClick={() => { setShowNewYarnForm(false); setNewYarnData({}); }} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Avbryt</button>
                </div>
              </div>
            ) : pendingYarn ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                  {pendingYarn.imageUrl ? (
                    <img src={pendingYarn.imageUrl} alt={pendingYarn.name} style={{ width: 24, height: 24, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} />
                  ) : pendingYarn.color ? (
                    <div style={{ width: 24, height: 24, borderRadius: 999, background: pendingYarn.color, flexShrink: 0, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)' }} />
                  ) : null}
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{pendingYarn.name}</div>
                    {pendingYarn.brand && <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{pendingYarn.brand}</div>}
                  </div>
                </div>
                <input
                  autoFocus
                  placeholder="Mengde (f.eks. 400m, 3 nøster)"
                  value={pendingYarnAmount}
                  onChange={e => setPendingYarnAmount(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddYarn(pendingYarn, pendingYarnAmount); }}
                  style={{ height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => handleAddYarn(pendingYarn, pendingYarnAmount)} style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Legg til</button>
                  <button onClick={() => { setPendingYarn(null); setPendingYarnAmount(''); }} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Avbryt</button>
                </div>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableYarns.map(yarn => (
                  <button key={yarn.id} onClick={() => setPendingYarn(yarn)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                    {yarn.imageUrl ? (
                      <img src={yarn.imageUrl} alt={yarn.name} style={{ width: 28, height: 28, borderRadius: 999, objectFit: 'cover', flexShrink: 0, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)' }} />
                    ) : yarn.color ? (
                      <div style={{ width: 28, height: 28, borderRadius: 999, background: yarn.color, flexShrink: 0, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)' }} />
                    ) : null}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{yarn.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{[yarn.brand, yarn.weight].filter(Boolean).join(' · ')}</div>
                    </div>
                  </button>
                ))}
                {availableYarns.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--muted-fg)', fontSize: 14, padding: '16px 0 8px' }}>Ingen garn tilgjengelig i lager</div>
                )}
                <button onClick={() => setShowNewYarnForm(true)} style={dashedBtn}>+ Nytt garn</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* NEEDLE PICKER */}
      {showNeedlePicker && (
        <>
          <div onClick={() => { setShowNeedlePicker(false); setShowNewNeedleForm(false); setNewNeedleData({ type: 'Rundpinne' }); }} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'color-mix(in oklab, #000 25%, transparent)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--shell-max-w)', zIndex: 51, background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '12px 20px 36px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '0 auto 18px' }} />
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: showNewNeedleForm ? 4 : 14 }}>
              {showNewNeedleForm ? 'Ny pinne' : 'Velg pinne'}
            </div>
            {showNewNeedleForm && (
              <div style={{ fontSize: 12.5, color: 'var(--muted-fg)', marginBottom: 14 }}>
                Lag en pinne som bare brukes i dette prosjektet.
              </div>
            )}
            {showNewNeedleForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={needleFieldLabel}>
                    Størrelse <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <input
                    autoFocus
                    placeholder="f.eks. 4mm"
                    value={newNeedleData.size || ''}
                    onChange={e => setNewNeedleData(d => ({ ...d, size: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddNewNeedle(); }}
                    style={needleFieldInput}
                  />
                </div>
                <div>
                  <label style={needleFieldLabel}>Type</label>
                  <select
                    value={newNeedleData.type || 'Rundpinne'}
                    onChange={e => setNewNeedleData(d => ({ ...d, type: e.target.value }))}
                    style={needleFieldInput}
                  >
                    {['Rundpinne','Strømpepinne','Settpinner','Utskiftbar','Heklenål','Annet'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={needleFieldLabel}>Lengde</label>
                    <input
                      placeholder="f.eks. 80cm"
                      value={newNeedleData.length || ''}
                      onChange={e => setNewNeedleData(d => ({ ...d, length: e.target.value }))}
                      style={needleFieldInput}
                    />
                  </div>
                  <div>
                    <label style={needleFieldLabel}>Materiale</label>
                    <input
                      placeholder="f.eks. bambus"
                      value={newNeedleData.material || ''}
                      onChange={e => setNewNeedleData(d => ({ ...d, material: e.target.value }))}
                      style={needleFieldInput}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {(() => {
                    const canSubmit = !!newNeedleData.size?.trim();
                    return (
                      <button
                        onClick={handleAddNewNeedle}
                        disabled={!canSubmit}
                        style={{
                          flex: 1, height: 44, borderRadius: 12, border: 'none',
                          background: canSubmit ? 'var(--fg)' : 'var(--muted)',
                          color: canSubmit ? 'var(--bg)' : 'var(--muted-fg)',
                          cursor: canSubmit ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                        }}
                      >
                        Legg til
                      </button>
                    );
                  })()}
                  <button onClick={() => { setShowNewNeedleForm(false); setNewNeedleData({ type: 'Rundpinne' }); }} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Avbryt</button>
                </div>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableNeedles.map(needle => {
                  const remaining = remainingForOffer(needle);
                  return (
                    <button key={needle.id} onClick={() => handleAddNeedle(needle)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l6-6M8 16l8-8 5-5-1 5-8 8z"/><circle cx="6.5" cy="17.5" r="1"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{needle.size} · {needle.type}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{[needle.material, needle.length].filter(Boolean).join(' · ')}</div>
                      </div>
                      {needle.quantity > 1 && <div style={{ fontSize: 12, color: 'var(--muted-fg)', flexShrink: 0 }}>{remaining} av {needle.quantity} ledig</div>}
                    </button>
                  );
                })}
                {availableNeedles.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--muted-fg)', fontSize: 14, padding: '16px 0 8px' }}>
                    Ingen pinner tilgjengelig i lager
                  </div>
                )}
                <button onClick={() => setShowNewNeedleForm(true)} style={dashedBtn}>+ Ny pinne</button>
              </div>
            )}
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


      {showHeroLightbox && editedProject.images[currentImgIdx] && (
        <div
          onClick={() => setShowHeroLightbox(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'color-mix(in oklab, #000 88%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img
            src={editedProject.images[currentImgIdx]}
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
