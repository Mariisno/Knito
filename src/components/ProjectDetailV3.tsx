import { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  ChevronLeft, MoreVertical, Share2, Plus, Edit3, Loader2, Play, Pause, Clock,
  CheckCircle2, ChevronDown, ChevronUp, Trash2, Minus, ExternalLink, FileText, X,
} from 'lucide-react';
import { format } from 'date-fns';
import * as api from '../utils/api';
import type { KnittingProject, ProjectStatus, Counter, LogEntry, NeedleInventoryItem, Yarn } from '../types/knitting';
import { KnitTexture, paletteForId } from './KnitTexture';
import { useTranslation } from '../contexts/LanguageContext';
import { getDateFnsLocale } from '../utils/formatDate';
import { getAllYarnAvailability } from '../utils/yarns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

interface ProjectDetailV3Props {
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

const STATUS_ICON: Record<ProjectStatus, typeof Play> = {
  Aktiv: Play,
  'På vent': Pause,
  Planlagt: Clock,
  Fullført: CheckCircle2,
  Arkivert: Pause,
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  Aktiv: 'var(--primary)',
  'På vent': 'var(--status-pending, #c9856b)',
  Planlagt: 'var(--muted-fg)',
  Fullført: 'var(--status-completed, #5a7a6a)',
  Arkivert: 'var(--muted-fg)',
};

const sectionCardStyle: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
  padding: 16, marginBottom: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: -0.2,
};

const iconBtnStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 999, border: 'none',
  background: 'var(--primary)', color: 'var(--primary-foreground)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

function StatusPill({ status, onClick }: { status: ProjectStatus; onClick?: () => void }) {
  const { t } = useTranslation();
  const Icon = STATUS_ICON[status];
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 30, padding: '0 12px', borderRadius: 999,
        border: '1px solid var(--border)', background: 'var(--card)',
        color: STATUS_COLOR[status], cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
      }}
    >
      <Icon size={14} strokeWidth={2.2} />
      <span style={{ color: 'var(--fg)' }}>{t(`status.${status}`)}</span>
    </button>
  );
}

export function ProjectDetailV3({
  project, projects, onBack, onUpdate, onDelete, accessToken,
  standaloneYarns, onUpdateStandaloneYarns,
}: ProjectDetailV3Props) {
  const { t, language } = useTranslation();
  const dateLocale = getDateFnsLocale(language);

  const [editedProject, setEditedProject] = useState(project);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingPattern, setUploadingPattern] = useState(false);

  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipeUrlDraft, setRecipeUrlDraft] = useState('');

  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState({
    name: project.name,
    category: project.category ?? '',
    startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
    endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
  });

  const [showYarnForm, setShowYarnForm] = useState(false);
  const [yarnPickerId, setYarnPickerId] = useState<string>('');
  const [yarnPickerQty, setYarnPickerQty] = useState<number>(1);
  const [newYarnName, setNewYarnName] = useState('');

  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterLabel, setCounterLabel] = useState('');
  const [counterTarget, setCounterTarget] = useState('');

  const [noteDraft, setNoteDraft] = useState(project.notes ?? '');

  const [showLogForm, setShowLogForm] = useState(false);
  const [logText, setLogText] = useState('');

  const [showGaugeForm, setShowGaugeForm] = useState(false);
  const [gaugeDraft, setGaugeDraft] = useState({
    stitches: project.gauge?.stitchesPer10cm?.toString() ?? '',
    rows: project.gauge?.rowsPer10cm?.toString() ?? '',
    needleSize: project.gauge?.needleSize ?? '',
    notes: project.gauge?.notes ?? '',
  });

  const imgInputRef = useRef<HTMLInputElement>(null);
  const patternFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedProject(project);
    setNoteDraft(project.notes ?? '');
  }, [project.id]);

  const noteDirty = noteDraft !== (editedProject.notes ?? '');

  const commit = (updates: Partial<KnittingProject>) => {
    const next = { ...editedProject, ...updates };
    setEditedProject(next);
    onUpdate(next);
  };

  // ----- Image -----
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      commit({ images: [url, ...editedProject.images] });
      toast.success(t('toasts.imageAdded'));
    } catch {
      toast.error(t('toasts.imageUploadFailed'));
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  // ----- Share -----
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: editedProject.name,
          text: t('projectDetailV3.shareText', { name: editedProject.name }),
          url,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success(t('projectDetailV3.linkCopied'));
      }
    } catch {
      // user cancelled — silent
    }
  };

  // ----- Recipe -----
  const openRecipeForm = () => {
    setRecipeUrlDraft(editedProject.pattern?.url ?? '');
    setShowRecipeForm(true);
  };

  const saveRecipeUrl = () => {
    const trimmed = recipeUrlDraft.trim();
    const normalized = trimmed
      ? (/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
      : undefined;
    commit({ pattern: { ...editedProject.pattern, url: normalized } });
    setShowRecipeForm(false);
  };

  const handlePatternFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPattern(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      const existing = editedProject.pattern?.files ?? [];
      commit({ pattern: { ...editedProject.pattern, files: [...existing, { url, name: file.name }] } });
      toast.success(t('toasts.recipeAdded'));
    } catch {
      toast.error(t('toasts.recipeUploadFailed'));
    } finally {
      setUploadingPattern(false);
      e.target.value = '';
    }
  };

  // ----- Details -----
  const openDetailsForm = () => {
    setDetailsDraft({
      name: editedProject.name,
      category: editedProject.category ?? '',
      startDate: editedProject.startDate ? format(new Date(editedProject.startDate), 'yyyy-MM-dd') : '',
      endDate: editedProject.endDate ? format(new Date(editedProject.endDate), 'yyyy-MM-dd') : '',
    });
    setShowDetailsForm(true);
  };

  const saveDetails = () => {
    const name = detailsDraft.name.trim() || editedProject.name;
    commit({
      name,
      category: detailsDraft.category.trim() || undefined,
      startDate: detailsDraft.startDate ? new Date(detailsDraft.startDate) : undefined,
      endDate: detailsDraft.endDate ? new Date(detailsDraft.endDate) : undefined,
    });
    setShowDetailsForm(false);
  };

  // ----- Yarns -----
  const yarnAvailability = useMemo(
    () => getAllYarnAvailability(standaloneYarns, projects),
    [standaloneYarns, projects],
  );

  const yarnRemaining = (yarnId: string): number => {
    const a = yarnAvailability.get(yarnId);
    if (!a) return 0;
    if (a.totalQuantity === 0) return 0;
    return a.availableCount;
  };

  const availableYarns = useMemo(
    () => standaloneYarns.filter(y => {
      if (editedProject.yarns.some(ey => ey.standaloneYarnId === y.id)) return false;
      const a = yarnAvailability.get(y.id);
      if (!a || a.totalQuantity === 0) return true;
      return a.availableCount > 0;
    }),
    [standaloneYarns, editedProject.yarns, yarnAvailability],
  );

  const addYarnFromInventory = () => {
    const source = standaloneYarns.find(y => y.id === yarnPickerId);
    if (!source) return;
    const remaining = yarnRemaining(source.id);
    const total = source.quantity ?? 0;
    const requested = Math.max(1, yarnPickerQty);
    const quantity = total > 0 ? Math.min(remaining, requested) : requested;
    if (total > 0 && quantity <= 0) {
      toast.error(t('yarn.statusBusy'));
      return;
    }
    const projectYarn: Yarn = {
      id: crypto.randomUUID(),
      standaloneYarnId: source.id,
      name: source.name,
      brand: source.brand,
      color: source.color,
      weight: source.weight,
      fiberContent: source.fiberContent,
      yardage: source.yardage,
      dyeLot: source.dyeLot,
      notes: source.notes,
      imageUrl: source.imageUrl,
      quantity,
      quantityUsed: 0,
    };
    commit({ yarns: [...editedProject.yarns, projectYarn] });
    setYarnPickerId('');
    setYarnPickerQty(1);
    setShowYarnForm(false);
    toast.success(t('toasts.yarnAdded'));
  };

  const addNewYarn = () => {
    const trimmed = newYarnName.trim();
    if (!trimmed) return;
    const inventory: Yarn = { id: crypto.randomUUID(), name: trimmed };
    const projectYarn: Yarn = {
      id: crypto.randomUUID(),
      standaloneYarnId: inventory.id,
      name: trimmed,
      quantityUsed: 0,
    };
    onUpdateStandaloneYarns([...standaloneYarns, inventory]);
    commit({ yarns: [...editedProject.yarns, projectYarn] });
    setNewYarnName('');
    setShowYarnForm(false);
    toast.success(t('toasts.yarnAdded'));
  };

  const removeYarn = (yarnId: string) => {
    commit({ yarns: editedProject.yarns.filter(y => y.id !== yarnId) });
  };

  // ----- Counters -----
  const addCounter = () => {
    const label = counterLabel.trim();
    if (!label) return;
    const target = parseInt(counterTarget, 10);
    const counter: Counter = {
      id: crypto.randomUUID(),
      label,
      count: 0,
      ...(Number.isFinite(target) && target > 0 ? { target, repeats: 0 } : {}),
    };
    commit({ counters: [...(editedProject.counters ?? []), counter] });
    setCounterLabel('');
    setCounterTarget('');
    setShowCounterForm(false);
    toast.success(t('toasts.counterAdded'));
  };

  const stepCounter = (id: string, delta: number) => {
    const list = editedProject.counters ?? [];
    const c = list.find(x => x.id === id);
    if (!c) return;
    let count = c.count + delta;
    let repeats = c.repeats ?? 0;
    if (c.target && c.target > 0) {
      while (count >= c.target) { count -= c.target; repeats += 1; }
      while (count < 0 && repeats > 0) { count += c.target; repeats -= 1; }
    }
    count = Math.max(0, count);
    commit({
      counters: list.map(x => x.id === id
        ? { ...x, count, ...(c.target && c.target > 0 ? { repeats } : {}) }
        : x),
    });
  };

  const deleteCounter = (id: string) => {
    commit({ counters: (editedProject.counters ?? []).filter(c => c.id !== id) });
  };

  // ----- Notes -----
  const saveNote = () => {
    commit({ notes: noteDraft });
    toast.success(t('common.saved'));
  };

  // ----- Log -----
  const addLogEntry = () => {
    const trimmed = logText.trim();
    if (!trimmed) return;
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      text: trimmed,
      timestamp: new Date(),
    };
    commit({ logEntries: [entry, ...(editedProject.logEntries ?? [])] });
    setLogText('');
    setShowLogForm(false);
    toast.success(t('toasts.logAdded'));
  };

  const deleteLogEntry = (id: string) => {
    commit({ logEntries: (editedProject.logEntries ?? []).filter(e => e.id !== id) });
  };

  // ----- Gauge -----
  const openGaugeForm = () => {
    setGaugeDraft({
      stitches: editedProject.gauge?.stitchesPer10cm?.toString() ?? '',
      rows: editedProject.gauge?.rowsPer10cm?.toString() ?? '',
      needleSize: editedProject.gauge?.needleSize ?? '',
      notes: editedProject.gauge?.notes ?? '',
    });
    setShowGaugeForm(true);
  };

  const saveGauge = () => {
    const stitches = parseInt(gaugeDraft.stitches, 10);
    const rows = parseInt(gaugeDraft.rows, 10);
    commit({
      gauge: {
        stitchesPer10cm: Number.isFinite(stitches) && stitches > 0 ? stitches : undefined,
        rowsPer10cm: Number.isFinite(rows) && rows > 0 ? rows : undefined,
        needleSize: gaugeDraft.needleSize.trim() || undefined,
        notes: gaugeDraft.notes.trim() || undefined,
      },
    });
    setShowGaugeForm(false);
  };

  // ----- Status actions -----
  const startProject = () => {
    commit({
      status: 'Aktiv',
      startDate: editedProject.startDate ?? new Date(),
    });
  };

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionUsage, setCompletionUsage] = useState<Record<string, number>>({});

  const completeProject = () => {
    const yarnsWithLink = editedProject.yarns.filter(y => y.standaloneYarnId);
    if (yarnsWithLink.length === 0) {
      commit({ status: 'Fullført', progress: 100, endDate: new Date() });
      toast.success(t('toasts.projectCompleted'));
      return;
    }
    const initial: Record<string, number> = {};
    for (const y of yarnsWithLink) {
      const allocated = y.quantity ?? 1;
      const consumed = y.quantityUsed ?? 0;
      initial[y.id] = Math.min(allocated, Math.max(consumed, allocated));
    }
    setCompletionUsage(initial);
    setShowCompleteDialog(true);
  };

  const confirmCompleteProject = () => {
    const updatedYarns = editedProject.yarns.map(y => {
      if (!y.standaloneYarnId) return y;
      const chosen = completionUsage[y.id] ?? y.quantityUsed ?? 0;
      const allocated = y.quantity ?? 1;
      const finalUsed = Math.max(0, Math.min(allocated, chosen));
      return { ...y, quantityUsed: finalUsed };
    });

    let newStandaloneYarns = standaloneYarns;
    let standaloneChanged = false;
    for (const y of editedProject.yarns) {
      if (!y.standaloneYarnId) continue;
      const prevUsed = y.quantityUsed ?? 0;
      const chosen = completionUsage[y.id] ?? prevUsed;
      const allocated = y.quantity ?? 1;
      const finalUsed = Math.max(0, Math.min(allocated, chosen));
      const delta = finalUsed - prevUsed;
      if (delta === 0) continue;
      newStandaloneYarns = newStandaloneYarns.map(s =>
        s.id === y.standaloneYarnId
          ? { ...s, quantity: Math.max(0, (s.quantity ?? 0) - delta) }
          : s,
      );
      standaloneChanged = true;
    }

    if (standaloneChanged) {
      onUpdateStandaloneYarns(newStandaloneYarns);
    }

    const next = {
      ...editedProject,
      yarns: updatedYarns,
      status: 'Fullført' as ProjectStatus,
      progress: 100,
      endDate: new Date(),
    };
    setEditedProject(next);
    onUpdate(next);
    setShowCompleteDialog(false);
    setCompletionUsage({});
    toast.success(t('toasts.projectCompleted'));
  };

  const reopenProject = () => {
    commit({ status: 'Aktiv', endDate: undefined });
  };

  // ----- Renders -----
  const heroImage = editedProject.images[0];
  const recipeUrl = editedProject.pattern?.url;
  const recipeFiles = editedProject.pattern?.files ?? [];
  const hasRecipe = !!recipeUrl || recipeFiles.length > 0;

  const yarns = editedProject.yarns;
  const counters = editedProject.counters ?? [];
  const logEntries = editedProject.logEntries ?? [];
  const hasGauge = !!(editedProject.gauge?.stitchesPer10cm || editedProject.gauge?.rowsPer10cm || editedProject.gauge?.needleSize || editedProject.gauge?.notes);

  const dateRange = (() => {
    const start = editedProject.startDate ? format(new Date(editedProject.startDate), 'd. MMM yyyy', { locale: dateLocale }) : null;
    const end = editedProject.endDate ? format(new Date(editedProject.endDate), 'd. MMM yyyy', { locale: dateLocale }) : null;
    if (start && end) return `${start} – ${end}`;
    if (start) return start;
    return null;
  })();

  const detailsHasContent = !!(editedProject.category || dateRange);

  return (
    <div style={{
      height: '100%', overflowY: 'auto', background: 'var(--bg)',
      WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain',
      fontFamily: 'var(--font-ui)', position: 'relative',
    } as React.CSSProperties}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)',
        paddingTop: 'calc(8px + env(safe-area-inset-top))', paddingBottom: 8,
        paddingLeft: 12, paddingRight: 12,
        display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', gap: 8,
        borderBottom: '1px solid color-mix(in oklab, var(--border) 60%, transparent)',
      }}>
        <button onClick={() => onBack()} aria-label={t('common.back')} style={{
          width: 40, height: 40, borderRadius: 12, border: 'none', background: 'transparent',
          color: 'var(--fg)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, letterSpacing: -0.2,
          textAlign: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {editedProject.name}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label={t('common.edit')} style={{
              width: 40, height: 40, borderRadius: 12, border: 'none', background: 'transparent',
              color: 'var(--fg)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MoreVertical size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={openDetailsForm}>
              <Edit3 className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            {editedProject.status !== 'Arkivert' ? (
              <DropdownMenuItem onClick={() => commit({ status: 'Arkivert' })}>
                {t('projectDetail.archive')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => commit({ status: 'Aktiv' })}>
                {t('projectDetail.unarchive')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('projectDetail.deleteProject')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status row + Del */}
      <div style={{
        padding: '12px 20px 8px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
      }}>
        <StatusPill status={editedProject.status} />
        <button onClick={handleShare} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 30, padding: '0 14px', borderRadius: 999, border: 'none',
          background: 'var(--primary)', color: 'var(--primary-foreground)',
          cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
        }}>
          <Share2 size={14} />
          {t('projectDetailV3.share')}
        </button>
      </div>

      {/* Hero image */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '1 / 1',
          background: 'var(--accent)', borderRadius: 18, overflow: 'hidden',
        }}>
          {heroImage ? (
            <img src={heroImage} alt={editedProject.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <KnitTexture variant={paletteForId(editedProject.id)} />
          )}
          <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          <button
            onClick={() => imgInputRef.current?.click()}
            disabled={uploadingImg}
            aria-label={t('projectDetail.addImages')}
            style={{
              position: 'absolute', right: 12, bottom: 12,
              width: 44, height: 44, borderRadius: 999, border: 'none',
              background: 'var(--primary)', color: 'var(--primary-foreground)',
              cursor: uploadingImg ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: uploadingImg ? 0.6 : 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            }}
          >
            {uploadingImg ? <Loader2 className="animate-spin" size={20} /> : <Plus size={22} strokeWidth={2.2} />}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* Oppskrift */}
        <div style={sectionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasRecipe ? 10 : 0 }}>
            <div style={sectionTitleStyle}>{t('projectDetailV3.sectionRecipe')}</div>
            <button onClick={openRecipeForm} style={iconBtnStyle} aria-label={t('projectDetail.addPattern')}>
              <Plus size={18} strokeWidth={2.2} />
            </button>
          </div>
          {hasRecipe ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recipeUrl && (
                <a href={recipeUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                  borderRadius: 12, background: 'var(--accent)', color: 'var(--fg)',
                  textDecoration: 'none', fontSize: 13.5,
                }}>
                  <ExternalLink size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {recipeUrl.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                  </span>
                </a>
              )}
              {recipeFiles.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                  borderRadius: 12, background: 'var(--accent)', color: 'var(--fg)',
                  textDecoration: 'none', fontSize: 13.5,
                }}>
                  <FileText size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                </a>
              ))}
              <input ref={patternFileRef} type="file" onChange={handlePatternFileUpload} style={{ display: 'none' }} />
              <button onClick={() => patternFileRef.current?.click()} disabled={uploadingPattern} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                background: 'transparent', border: '1px dashed var(--border)', borderRadius: 12,
                padding: '8px 14px', color: 'var(--muted-fg)', cursor: 'pointer', fontSize: 13,
              }}>
                {uploadingPattern ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {t('projectDetail.addFile')}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted-fg)', marginTop: 12 }}>
              {t('projectDetailV3.emptyRecipe')}
            </div>
          )}
        </div>

        {/* Detaljer */}
        <div style={sectionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={sectionTitleStyle}>{t('projectDetailV3.sectionDetails')}</div>
            <button onClick={openDetailsForm} style={iconBtnStyle} aria-label={t('common.edit')}>
              <Edit3 size={16} strokeWidth={2.2} />
            </button>
          </div>
          {detailsHasContent ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {editedProject.category && (
                <div style={{ fontSize: 13.5 }}>
                  <span style={{ color: 'var(--muted-fg)' }}>{t('category.label')}: </span>
                  {editedProject.category}
                </div>
              )}
              {dateRange && (
                <div style={{ fontSize: 13.5 }}>
                  <span style={{ color: 'var(--muted-fg)' }}>{t('projectDetail.started')}: </span>
                  {dateRange}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted-fg)', marginTop: 10 }}>
              {t('projectDetailV3.emptyDetails')}
            </div>
          )}
        </div>

        {/* Garn */}
        <div style={sectionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={sectionTitleStyle}>{t('projectDetailV3.sectionYarn')}</div>
            <button onClick={() => setShowYarnForm(true)} style={iconBtnStyle} aria-label={t('projectDetail.addYarn')}>
              <Plus size={18} strokeWidth={2.2} />
            </button>
          </div>
          {yarns.length > 0 ? (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {yarns.map(y => (
                <div key={y.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  background: 'var(--accent)', borderRadius: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {y.name}
                    </div>
                    {(y.color || y.brand || y.quantity) && (
                      <div style={{ fontSize: 12, color: 'var(--muted-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[
                          [y.brand, y.color].filter(Boolean).join(' · '),
                          y.quantity ? t('yarn.skeinsCount', { count: y.quantity }) : null,
                        ].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeYarn(y.id)} aria-label={t('common.delete')} style={{
                    width: 30, height: 30, border: 'none', background: 'transparent',
                    color: 'var(--muted-fg)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted-fg)', marginTop: 10 }}>
              {t('projectDetailV3.emptyYarn')}
            </div>
          )}
        </div>

        {/* Omgangsteller */}
        <div style={sectionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={sectionTitleStyle}>{t('projectDetailV3.sectionCounters')}</div>
            <button onClick={() => setShowCounterForm(true)} style={iconBtnStyle} aria-label={t('projectDetail.addCounter')}>
              <Plus size={18} strokeWidth={2.2} />
            </button>
          </div>
          {counters.length > 0 ? (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {counters.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                  background: 'var(--accent)', borderRadius: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>
                      {c.count}{c.target ? ` / ${c.target}` : ''}
                      {c.repeats ? ` · ${c.repeats}×` : ''}
                    </div>
                  </div>
                  <button onClick={() => stepCounter(c.id, -1)} aria-label={t('projectDetail.decrement')} style={{
                    width: 34, height: 34, borderRadius: 999, border: '1px solid var(--border)',
                    background: 'var(--bg)', color: 'var(--fg)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Minus size={16} />
                  </button>
                  <button onClick={() => stepCounter(c.id, 1)} aria-label={t('projectDetail.increment')} style={{
                    width: 34, height: 34, borderRadius: 999, border: 'none',
                    background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Plus size={16} strokeWidth={2.4} />
                  </button>
                  <button onClick={() => deleteCounter(c.id)} aria-label={t('common.delete')} style={{
                    width: 30, height: 30, border: 'none', background: 'transparent',
                    color: 'var(--muted-fg)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted-fg)', marginTop: 10 }}>
              {t('projectDetailV3.emptyCounters')}
            </div>
          )}
        </div>

        {/* Notater */}
        <div style={sectionCardStyle}>
          <div style={{ ...sectionTitleStyle, marginBottom: 10 }}>{t('projectDetailV3.sectionNotes')}</div>
          <textarea
            value={noteDraft}
            onChange={e => setNoteDraft(e.target.value)}
            placeholder={t('projectDetail.notesPlaceholder')}
            rows={4}
            style={{
              width: '100%', padding: 12, borderRadius: 12,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--fg)', fontFamily: 'inherit', fontSize: 14,
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={saveNote}
              disabled={!noteDirty}
              style={{
                height: 36, padding: '0 18px', borderRadius: 999, border: 'none',
                background: noteDirty ? 'var(--primary)' : 'var(--accent)',
                color: noteDirty ? 'var(--primary-foreground)' : 'var(--muted-fg)',
                cursor: noteDirty ? 'pointer' : 'default',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              }}
            >
              {t('projectDetailV3.saveNote')}
            </button>
          </div>
        </div>

        {/* Vis mer */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'transparent', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer',
            padding: '12px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}
        >
          {showAdvanced ? t('projectDetailV3.showLess') : t('projectDetailV3.showMore')}
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <>
            {/* Strikkefasthet */}
            <div style={sectionCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={sectionTitleStyle}>{t('projectDetailV3.sectionGauge')}</div>
                <button onClick={openGaugeForm} style={iconBtnStyle} aria-label={t('common.edit')}>
                  <Edit3 size={16} strokeWidth={2.2} />
                </button>
              </div>
              {hasGauge ? (
                <div style={{ marginTop: 10, fontSize: 13.5, color: 'var(--fg)', lineHeight: 1.6 }}>
                  {[
                    editedProject.gauge?.stitchesPer10cm && `${editedProject.gauge.stitchesPer10cm} ${t('projectDetail.gaugeStitches')}`,
                    editedProject.gauge?.rowsPer10cm && `${editedProject.gauge.rowsPer10cm} ${t('projectDetail.gaugeRows')}`,
                    editedProject.gauge?.needleSize && `${t('projectDetail.gaugeNeedleSize')}: ${editedProject.gauge.needleSize}`,
                  ].filter(Boolean).join(' · ')}
                  {editedProject.gauge?.notes && (
                    <div style={{ fontSize: 12.5, color: 'var(--muted-fg)', marginTop: 6 }}>
                      {editedProject.gauge.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--muted-fg)', marginTop: 10 }}>
                  {t('projectDetailV3.emptyGauge')}
                </div>
              )}
            </div>

            {/* Logg */}
            <div style={sectionCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={sectionTitleStyle}>{t('projectDetailV3.sectionLog')}</div>
                <button onClick={() => setShowLogForm(true)} style={iconBtnStyle} aria-label={t('projectDetail.addLog')}>
                  <Plus size={18} strokeWidth={2.2} />
                </button>
              </div>
              {logEntries.length > 0 ? (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {logEntries.slice(0, 10).map(e => (
                    <div key={e.id} style={{
                      padding: '10px 12px', background: 'var(--accent)', borderRadius: 12,
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {e.text && <div style={{ fontSize: 13.5, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{e.text}</div>}
                        {e.imageUrl && (
                          <img src={e.imageUrl} alt="" style={{ marginTop: 8, maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                        )}
                        <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 4 }}>
                          {format(new Date(e.timestamp), 'd. MMM yyyy HH:mm', { locale: dateLocale })}
                        </div>
                      </div>
                      <button onClick={() => deleteLogEntry(e.id)} aria-label={t('projectDetail.deleteLogEntry')} style={{
                        width: 28, height: 28, border: 'none', background: 'transparent',
                        color: 'var(--muted-fg)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--muted-fg)', marginTop: 10 }}>
                  {t('projectDetailV3.emptyLog')}
                </div>
              )}
            </div>
          </>
        )}

        {/* Bottom actions */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 0 24px' }}>
          {editedProject.status === 'Fullført' ? (
            <button onClick={reopenProject} style={{
              flex: 1, height: 48, borderRadius: 12, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--fg)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            }}>
              {t('projectDetailV3.reopenProject')}
            </button>
          ) : editedProject.status === 'Aktiv' ? (
            <button onClick={completeProject} style={{
              flex: 1, height: 48, borderRadius: 12, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--fg)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            }}>
              {t('projectDetailV3.completeProject')}
            </button>
          ) : (
            <>
              <button onClick={startProject} style={{
                flex: 1, height: 48, borderRadius: 12, border: 'none',
                background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
              }}>
                {t('projectDetailV3.startProject')}
              </button>
              <button onClick={completeProject} style={{
                flex: 1, height: 48, borderRadius: 12, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--fg)', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
              }}>
                {t('projectDetailV3.completeProject')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recipe URL form modal */}
      {showRecipeForm && (
        <ModalSheet onClose={() => setShowRecipeForm(false)} title={t('projectDetail.patternUrl')}>
          <input
            value={recipeUrlDraft}
            onChange={e => setRecipeUrlDraft(e.target.value)}
            placeholder="https://..."
            autoFocus
            style={modalInputStyle}
          />
          <ModalActions onCancel={() => setShowRecipeForm(false)} onSave={saveRecipeUrl} />
        </ModalSheet>
      )}

      {/* Details form modal */}
      {showDetailsForm && (
        <ModalSheet onClose={() => setShowDetailsForm(false)} title={t('projectDetailV3.sectionDetails')}>
          <label style={modalLabelStyle}>{t('projects.fieldName')}</label>
          <input
            value={detailsDraft.name}
            onChange={e => setDetailsDraft({ ...detailsDraft, name: e.target.value })}
            style={modalInputStyle}
          />
          <label style={modalLabelStyle}>{t('category.label')}</label>
          <input
            value={detailsDraft.category}
            onChange={e => setDetailsDraft({ ...detailsDraft, category: e.target.value })}
            style={modalInputStyle}
          />
          <label style={modalLabelStyle}>{t('projectDetail.started')}</label>
          <input
            type="date"
            value={detailsDraft.startDate}
            onChange={e => setDetailsDraft({ ...detailsDraft, startDate: e.target.value })}
            style={modalInputStyle}
          />
          <label style={modalLabelStyle}>{t('projectDetail.finished')}</label>
          <input
            type="date"
            value={detailsDraft.endDate}
            onChange={e => setDetailsDraft({ ...detailsDraft, endDate: e.target.value })}
            style={modalInputStyle}
          />
          <ModalActions onCancel={() => setShowDetailsForm(false)} onSave={saveDetails} />
        </ModalSheet>
      )}

      {/* Yarn form modal */}
      {showYarnForm && (() => {
        const pickedYarn = standaloneYarns.find(y => y.id === yarnPickerId);
        const pickedTotal = pickedYarn?.quantity ?? 0;
        const pickedRemaining = pickedYarn ? yarnRemaining(pickedYarn.id) : 0;
        const pickedMax = pickedTotal > 0 ? Math.max(1, pickedRemaining) : 99;
        const clampedQty = Math.min(pickedMax, Math.max(1, yarnPickerQty));
        return (
          <ModalSheet onClose={() => { setShowYarnForm(false); setYarnPickerId(''); setYarnPickerQty(1); }} title={t('projectDetail.addYarn')}>
            {availableYarns.length > 0 && (
              <>
                <label style={modalLabelStyle}>{t('projects.pickFromInventoryYarn')}</label>
                <select
                  value={yarnPickerId}
                  onChange={e => { setYarnPickerId(e.target.value); setYarnPickerQty(1); }}
                  style={modalInputStyle}
                >
                  <option value="">—</option>
                  {availableYarns.map(y => {
                    const a = yarnAvailability.get(y.id);
                    const label = a && a.totalQuantity > 0
                      ? `${y.name}${y.color ? ` (${y.color})` : ''} — ${t('yarn.availableCount', { count: a.availableCount })}`
                      : `${y.name}${y.color ? ` (${y.color})` : ''}`;
                    return <option key={y.id} value={y.id}>{label}</option>;
                  })}
                </select>
                {yarnPickerId && pickedYarn && (
                  <>
                    <label style={modalLabelStyle}>{t('projectDetail.skeinsCount')}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <button
                        onClick={() => setYarnPickerQty(Math.max(1, clampedQty - 1))}
                        aria-label={t('projectDetail.decrement')}
                        style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', cursor: 'pointer', fontSize: 18, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >−</button>
                      <div style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{clampedQty}</div>
                      <button
                        onClick={() => setYarnPickerQty(Math.min(pickedMax, clampedQty + 1))}
                        disabled={clampedQty >= pickedMax}
                        aria-label={t('projectDetail.increment')}
                        style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', cursor: clampedQty >= pickedMax ? 'default' : 'pointer', fontSize: 18, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clampedQty >= pickedMax ? 0.4 : 1 }}
                      >+</button>
                    </div>
                    {pickedTotal > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginBottom: 10 }}>
                        {t('yarn.availableCount', { count: pickedRemaining })}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                      <button onClick={addYarnFromInventory} style={primaryBtnStyle}>
                        {t('common.add')}
                      </button>
                    </div>
                  </>
                )}
                <div style={{ height: 1, background: 'var(--border)', margin: '8px 0 14px' }} />
              </>
            )}
            <label style={modalLabelStyle}>{t('projects.newYarn')}</label>
            <input
              value={newYarnName}
              onChange={e => setNewYarnName(e.target.value)}
              placeholder={t('projects.yarnNamePlaceholder')}
              style={modalInputStyle}
            />
            <ModalActions onCancel={() => { setShowYarnForm(false); setYarnPickerId(''); setYarnPickerQty(1); }} onSave={addNewYarn} saveDisabled={!newYarnName.trim()} />
          </ModalSheet>
        );
      })()}

      {/* Counter form modal */}
      {showCounterForm && (
        <ModalSheet onClose={() => setShowCounterForm(false)} title={t('projectDetail.addCounter')}>
          <label style={modalLabelStyle}>{t('projectDetail.counterLabel')}</label>
          <input
            value={counterLabel}
            onChange={e => setCounterLabel(e.target.value)}
            placeholder={t('projectDetail.counter')}
            autoFocus
            style={modalInputStyle}
          />
          <label style={modalLabelStyle}>{t('projectDetail.patternTotalRows')} ({t('common.optional')})</label>
          <input
            type="number"
            inputMode="numeric"
            value={counterTarget}
            onChange={e => setCounterTarget(e.target.value)}
            style={modalInputStyle}
          />
          <ModalActions onCancel={() => setShowCounterForm(false)} onSave={addCounter} saveDisabled={!counterLabel.trim()} />
        </ModalSheet>
      )}

      {/* Log form modal */}
      {showLogForm && (
        <ModalSheet onClose={() => setShowLogForm(false)} title={t('projectDetail.addLog')}>
          <textarea
            value={logText}
            onChange={e => setLogText(e.target.value)}
            placeholder={t('projectDetail.logTextPlaceholder')}
            rows={4}
            autoFocus
            style={{ ...modalInputStyle, resize: 'vertical', height: 'auto', padding: 12 }}
          />
          <ModalActions onCancel={() => setShowLogForm(false)} onSave={addLogEntry} saveDisabled={!logText.trim()} />
        </ModalSheet>
      )}

      {/* Gauge form modal */}
      {showGaugeForm && (
        <ModalSheet onClose={() => setShowGaugeForm(false)} title={t('projectDetail.gauge')}>
          <label style={modalLabelStyle}>{t('projectDetail.gaugeStitches')}</label>
          <input
            type="number"
            inputMode="numeric"
            value={gaugeDraft.stitches}
            onChange={e => setGaugeDraft({ ...gaugeDraft, stitches: e.target.value })}
            style={modalInputStyle}
          />
          <label style={modalLabelStyle}>{t('projectDetail.gaugeRows')}</label>
          <input
            type="number"
            inputMode="numeric"
            value={gaugeDraft.rows}
            onChange={e => setGaugeDraft({ ...gaugeDraft, rows: e.target.value })}
            style={modalInputStyle}
          />
          <label style={modalLabelStyle}>{t('projectDetail.gaugeNeedleSize')}</label>
          <input
            value={gaugeDraft.needleSize}
            onChange={e => setGaugeDraft({ ...gaugeDraft, needleSize: e.target.value })}
            placeholder="4mm"
            style={modalInputStyle}
          />
          <label style={modalLabelStyle}>{t('projectDetail.gaugeNotes')}</label>
          <textarea
            value={gaugeDraft.notes}
            onChange={e => setGaugeDraft({ ...gaugeDraft, notes: e.target.value })}
            rows={2}
            style={{ ...modalInputStyle, resize: 'vertical', height: 'auto', padding: 12 }}
          />
          <ModalActions onCancel={() => setShowGaugeForm(false)} onSave={saveGauge} />
        </ModalSheet>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projectDetail.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('projectDetail.deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(editedProject.id)}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete project confirmation: how many skeins were actually used */}
      <AlertDialog open={showCompleteDialog} onOpenChange={(open) => { if (!open) { setShowCompleteDialog(false); setCompletionUsage({}); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('completion.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('completion.yarnPrompt')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0', maxHeight: '50vh', overflowY: 'auto' }}>
            {editedProject.yarns.filter(y => y.standaloneYarnId).map(y => {
              const allocated = y.quantity ?? 1;
              const value = completionUsage[y.id] ?? y.quantityUsed ?? 0;
              return (
                <div key={y.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{y.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>
                      {t('completion.allocated', { count: allocated })}
                    </div>
                  </div>
                  <select
                    value={value}
                    onChange={e => setCompletionUsage(prev => ({ ...prev, [y.id]: parseInt(e.target.value, 10) }))}
                    style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 14 }}
                  >
                    {Array.from({ length: allocated + 1 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCompletionUsage({}); }}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCompleteProject}>
              {t('completion.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const modalInputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
  border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)',
  fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  marginBottom: 12,
};

const modalLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--muted-fg)', marginBottom: 6,
};

const primaryBtnStyle: React.CSSProperties = {
  height: 36, padding: '0 18px', borderRadius: 999, border: 'none',
  background: 'var(--primary)', color: 'var(--primary-foreground)',
  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
};

function ModalSheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'color-mix(in oklab, #000 45%, transparent)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 'var(--shell-max-w)', maxHeight: '85vh', overflowY: 'auto',
          background: 'var(--bg)', borderRadius: '20px 20px 0 0',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
          fontFamily: 'var(--font-ui)', color: 'var(--fg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} aria-label="Lukk" style={{
            width: 32, height: 32, border: 'none', background: 'transparent',
            color: 'var(--muted-fg)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onSave, saveDisabled }: { onCancel: () => void; onSave: () => void; saveDisabled?: boolean }) {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
      <button onClick={onCancel} style={{
        flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--border)',
        background: 'transparent', color: 'var(--fg)', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
      }}>
        {t('common.cancel')}
      </button>
      <button onClick={onSave} disabled={saveDisabled} style={{
        flex: 1, height: 44, borderRadius: 12, border: 'none',
        background: saveDisabled ? 'var(--accent)' : 'var(--primary)',
        color: saveDisabled ? 'var(--muted-fg)' : 'var(--primary-foreground)',
        cursor: saveDisabled ? 'default' : 'pointer',
        fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
      }}>
        {t('common.save')}
      </button>
    </div>
  );
}
