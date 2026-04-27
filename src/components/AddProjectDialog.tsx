import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { KnittingProject, Yarn, Needle, NeedleInventoryItem, CraftType } from '../types/knitting';
import * as api from '../utils/api';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

const NEEDLE_TYPES = ['Rundpinne', 'Strømpepinne', 'Settpinner', 'Utskiftbar', 'Heklenål', 'Annet'];

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProject: (project: Omit<KnittingProject, 'id' | 'createdAt'>) => Promise<KnittingProject | null>;
  onUpdateProject: (project: KnittingProject) => void;
  accessToken: string;
  standaloneYarns: Yarn[];
  needleInventory: NeedleInventoryItem[];
  onUpdateStandaloneYarns: (yarns: Yarn[]) => void;
  onUpdateNeedleInventory: (needles: NeedleInventoryItem[]) => void;
}

const CATEGORIES = ['Genser', 'Sjal', 'Sokker', 'Kofte', 'Teppe', 'Lue', 'Annet'];

export function AddProjectDialog({ open, onOpenChange, onAddProject, onUpdateProject, accessToken, standaloneYarns, needleInventory, onUpdateStandaloneYarns, onUpdateNeedleInventory }: AddProjectDialogProps) {
  const [name, setName] = useState('');
  const [craftType, setCraftType] = useState<CraftType>('Strikking');
  const [category, setCategory] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedPdf, setUploadedPdf] = useState<{ url: string; name: string } | null>(null);
  const [recipeUrl, setRecipeUrl] = useState('');
  const [selectedYarns, setSelectedYarns] = useState<Yarn[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showYarnPicker, setShowYarnPicker] = useState(false);
  const [showNewYarnModal, setShowNewYarnModal] = useState(false);
  const [newYarnName, setNewYarnName] = useState('');
  const [newYarnColor, setNewYarnColor] = useState('');
  const [newYarnAmount, setNewYarnAmount] = useState('');
  const [saveYarnToInventory, setSaveYarnToInventory] = useState(false);

  const [selectedNeedles, setSelectedNeedles] = useState<Needle[]>([]);
  const [showNeedlePicker, setShowNeedlePicker] = useState(false);
  const [showNewNeedleModal, setShowNewNeedleModal] = useState(false);
  const [newNeedleSize, setNewNeedleSize] = useState('');
  const [newNeedleType, setNewNeedleType] = useState('Rundpinne');
  const [newNeedleLength, setNewNeedleLength] = useState('');
  const [newNeedleMaterial, setNewNeedleMaterial] = useState('');
  const [saveNeedleToInventory, setSaveNeedleToInventory] = useState(false);

  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const createdAtRef = useRef<Date | null>(null);
  const isClosingRef = useRef(false);
  const isSavingRef = useRef(false);
  const dirtyRef = useRef(false);

  const reset = () => {
    setName('');
    setCraftType('Strikking');
    setCategory('');
    setUploadedImages([]);
    setUploadedPdf(null);
    setRecipeUrl('');
    setSelectedYarns([]);
    setShowYarnPicker(false);
    setShowNewYarnModal(false);
    setNewYarnName('');
    setNewYarnColor('');
    setNewYarnAmount('');
    setSaveYarnToInventory(false);
    setSelectedNeedles([]);
    setShowNeedlePicker(false);
    setShowNewNeedleModal(false);
    setNewNeedleSize('');
    setNewNeedleType('Rundpinne');
    setNewNeedleLength('');
    setNewNeedleMaterial('');
    setSaveNeedleToInventory(false);
    setShowImageSourcePicker(false);
    setCreatedProjectId(null);
    setSaveStatus('idle');
    createdAtRef.current = null;
  };

  const buildPayload = (): Omit<KnittingProject, 'id' | 'createdAt'> => {
    const trimmedUrl = recipeUrl.trim();
    const normalizedUrl = trimmedUrl
      ? (/^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`)
      : undefined;
    const patternFields = {
      ...(uploadedPdf ? { pdfUrl: uploadedPdf.url, pdfName: uploadedPdf.name } : {}),
      ...(normalizedUrl ? { url: normalizedUrl } : {}),
    };
    return {
      name: name.trim(),
      craftType,
      category: category || undefined,
      progress: 0,
      status: 'Planlagt',
      images: uploadedImages,
      yarns: selectedYarns,
      needles: selectedNeedles,
      counters: [],
      ...(Object.keys(patternFields).length ? { pattern: patternFields } : {}),
    };
  };

  const performSave = async () => {
    if (!name.trim()) return;
    if (isSavingRef.current) {
      dirtyRef.current = true;
      return;
    }
    isSavingRef.current = true;
    dirtyRef.current = false;
    setSaveStatus('saving');
    try {
      if (createdProjectId === null) {
        const saved = await onAddProject(buildPayload());
        if (isClosingRef.current) return;
        if (saved) {
          setCreatedProjectId(saved.id);
          createdAtRef.current = saved.createdAt;
          setSaveStatus('saved');
        } else {
          setSaveStatus('idle');
        }
      } else {
        onUpdateProject({
          ...buildPayload(),
          id: createdProjectId,
          createdAt: createdAtRef.current ?? new Date(),
        });
        if (isClosingRef.current) return;
        setSaveStatus('saved');
      }
    } finally {
      isSavingRef.current = false;
      if (dirtyRef.current && !isClosingRef.current) {
        dirtyRef.current = false;
        debouncedSave();
      }
    }
  };

  const debouncedSave = useDebouncedCallback(() => {
    void performSave();
  }, 500);

  useEffect(() => {
    if (open) isClosingRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!name.trim()) return;
    debouncedSave();
  }, [open, name, craftType, category, uploadedImages, uploadedPdf, recipeUrl, selectedYarns, selectedNeedles, debouncedSave]);

  const handleClose = () => {
    debouncedSave.flush();
    isClosingRef.current = true;
    reset();
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    debouncedSave.flush();
    if (createdProjectId === null && !isSavingRef.current) {
      isClosingRef.current = true;
      await onAddProject(buildPayload());
    } else {
      isClosingRef.current = true;
    }
    reset();
    onOpenChange(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      setUploadedImages(prev => [...prev, url]);
      toast.success('Bilde lagt til');
    } catch {
      toast.error('Kunne ikke laste opp bilde');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Kun PDF-filer støttes'); return; }
    setUploadingPdf(true);
    try {
      const url = await api.uploadImage(file, accessToken);
      setUploadedPdf({ url, name: file.name });
      toast.success('Oppskrift lagt til');
    } catch {
      toast.error('Kunne ikke laste opp oppskrift');
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  const toggleYarn = (yarn: Yarn) => {
    setSelectedYarns(prev => {
      const linkedId = yarn.standaloneYarnId ?? yarn.id;
      const idx = prev.findIndex(y => (y.standaloneYarnId ?? y.id) === linkedId);
      if (idx !== -1) return prev.filter((_, i) => i !== idx);
      return [...prev, { ...yarn, id: crypto.randomUUID(), standaloneYarnId: linkedId }];
    });
  };

  const handleAddNewYarn = () => {
    if (!newYarnName.trim()) return;
    const id = crypto.randomUUID();
    const newYarn: Yarn = {
      id,
      name: newYarnName.trim(),
      color: newYarnColor.trim() || undefined,
      amount: newYarnAmount.trim() || undefined,
    };
    if (saveYarnToInventory) {
      onUpdateStandaloneYarns([...standaloneYarns, newYarn]);
      setSelectedYarns(prev => [...prev, { ...newYarn, id: crypto.randomUUID(), standaloneYarnId: id }]);
    } else {
      setSelectedYarns(prev => [...prev, newYarn]);
    }
    setNewYarnName('');
    setNewYarnColor('');
    setNewYarnAmount('');
    setSaveYarnToInventory(false);
    setShowNewYarnModal(false);
  };

  const toggleNeedle = (item: NeedleInventoryItem) => {
    setSelectedNeedles(prev => {
      const already = prev.some(n => n.inventoryNeedleId === item.id);
      if (already) return prev.filter(n => n.inventoryNeedleId !== item.id);
      return [...prev, {
        id: crypto.randomUUID(),
        size: item.size,
        type: item.type,
        length: item.length,
        material: item.material,
        inventoryNeedleId: item.id,
      }];
    });
  };

  const handleAddNewNeedle = () => {
    if (!newNeedleSize.trim()) return;
    const needleId = crypto.randomUUID();
    if (saveNeedleToInventory) {
      const inventoryItem: NeedleInventoryItem = {
        id: needleId,
        size: newNeedleSize.trim(),
        type: newNeedleType,
        length: newNeedleLength.trim() || undefined,
        material: newNeedleMaterial.trim() || undefined,
        quantity: 1,
      };
      onUpdateNeedleInventory([...needleInventory, inventoryItem]);
      setSelectedNeedles(prev => [...prev, {
        id: crypto.randomUUID(),
        size: inventoryItem.size,
        type: inventoryItem.type,
        length: inventoryItem.length,
        material: inventoryItem.material,
        inventoryNeedleId: needleId,
      }]);
    } else {
      setSelectedNeedles(prev => [...prev, {
        id: crypto.randomUUID(),
        size: newNeedleSize.trim(),
        type: newNeedleType,
        length: newNeedleLength.trim() || undefined,
        material: newNeedleMaterial.trim() || undefined,
      }]);
    }
    setNewNeedleSize('');
    setNewNeedleType('Rundpinne');
    setNewNeedleLength('');
    setNewNeedleMaterial('');
    setSaveNeedleToInventory(false);
    setShowNewNeedleModal(false);
  };

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'color-mix(in oklab, #000 30%, transparent)' }} />

      {/* sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 101,
        background: 'var(--bg)', borderRadius: '24px 24px 0 0',
        padding: '12px 20px 44px',
        maxHeight: '90%', overflowY: 'auto',
      }}>
        {/* drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '4px auto 14px' }} />

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted-fg)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', padding: 0 }}>
            {createdProjectId !== null ? 'Lukk' : 'Avbryt'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>Nytt prosjekt</div>
            {saveStatus !== 'idle' && (
              <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', letterSpacing: 0.5 }}>
                {saveStatus === 'saving' ? 'Lagrer …' : '✓ Lagret'}
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={!name.trim()} style={{ background: 'transparent', border: 'none', color: name.trim() ? 'var(--primary)' : 'var(--muted-fg)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default', padding: 0 }}>
            {createdProjectId !== null ? 'Ferdig' : 'Lagre'}
          </button>
        </div>

        {/* name field */}
        <div style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', letterSpacing: 1.3, textTransform: 'uppercase', fontWeight: 500, marginBottom: 6 }}>Prosjektnavn</div>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleClose(); }}
            placeholder="Ny genser"
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: 'var(--fg)', fontFamily: 'inherit', padding: 0 }}
          />
        </div>

        {/* craft type */}
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500, marginBottom: 10 }}>Håndverk</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {(['Strikking', 'Hekling'] as CraftType[]).map(ct => (
            <button key={ct} onClick={() => setCraftType(ct)} style={{
              height: 32, padding: '0 14px', borderRadius: 999, border: '1px solid var(--border)',
              background: craftType === ct ? 'var(--fg)' : 'var(--card)',
              color: craftType === ct ? 'var(--bg)' : 'var(--fg)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {ct}
            </button>
          ))}
        </div>

        {/* category */}
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500, marginBottom: 10 }}>Kategori</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(category === c ? '' : c)} style={{
              height: 32, padding: '0 14px', borderRadius: 999, border: '1px solid var(--border)',
              background: category === c ? 'var(--fg)' : 'var(--card)',
              color: category === c ? 'var(--bg)' : 'var(--fg)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {c}
            </button>
          ))}
        </div>

        {/* vedlegg */}
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500, marginBottom: 10 }}>Vedlegg</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          {/* bilde */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} disabled={uploadingImage} style={{ display: 'none' }} />
          <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ display: 'none' }} />
          <button type="button" onClick={() => !uploadingImage && setShowImageSourcePicker(true)} style={{ padding: '20px 16px', background: 'var(--card)', border: uploadedImages.length ? '1px solid var(--primary)' : '1px solid var(--border)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: uploadingImage ? 'not-allowed' : 'pointer', opacity: uploadingImage ? 0.6 : 1, width: '100%' }}>
            {uploadingImage
              ? <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: 'var(--muted-fg)' }} />
              : uploadedImages.length
                ? <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden' }}><img src={uploadedImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                : <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="var(--muted-fg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            }
            <span style={{ fontSize: 12.5, fontWeight: 500, color: uploadedImages.length ? 'var(--primary)' : 'var(--muted-fg)' }}>
              {uploadedImages.length ? `${uploadedImages.length} bilde${uploadedImages.length > 1 ? 'r' : ''}` : 'Legg til bilde'}
            </span>
          </button>

          {/* oppskrift */}
          <label style={{ padding: '20px 16px', background: 'var(--card)', border: uploadedPdf ? '1px solid var(--primary)' : '1px solid var(--border)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: uploadingPdf ? 'not-allowed' : 'pointer', opacity: uploadingPdf ? 0.6 : 1 }}>
            <input type="file" accept=".pdf" onChange={handlePdfUpload} disabled={uploadingPdf} style={{ display: 'none' }} />
            {uploadingPdf
              ? <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: 'var(--muted-fg)' }} />
              : <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={uploadedPdf ? 'var(--primary)' : 'var(--muted-fg)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            }
            <span style={{ fontSize: 12.5, fontWeight: 500, color: uploadedPdf ? 'var(--primary)' : 'var(--muted-fg)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {uploadedPdf ? uploadedPdf.name : 'Last opp oppskrift'}
            </span>
          </label>
        </div>

        <input
          type="url"
          inputMode="url"
          placeholder="Lenke til oppskrift (valgfritt)"
          value={recipeUrl}
          onChange={e => setRecipeUrl(e.target.value)}
          style={{
            width: '100%',
            marginBottom: 24,
            padding: '14px',
            background: 'var(--card)',
            border: recipeUrl ? '1px solid var(--primary)' : '1px solid var(--border)',
            borderRadius: 14,
            color: 'var(--fg)',
            fontFamily: 'inherit',
            fontSize: 13.5,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* garn */}
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500, marginBottom: 10 }}>Garn</div>

        {/* selected yarns */}
        {selectedYarns.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {selectedYarns.map(y => (
              <div key={y.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{y.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{[y.color, y.amount].filter(Boolean).join(' · ')}</div>
                <button onClick={() => toggleYarn(y)} style={{ background: 'transparent', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', padding: 2, display: 'flex' }}>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* yarn picker toggle */}
        <button onClick={() => setShowYarnPicker(v => !v)} style={{ width: '100%', padding: '14px 16px', border: '1px dashed var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-fg)', fontSize: 13.5, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Velg fra lager eller legg til nytt
        </button>

        {showYarnPicker && (
          <div style={{ marginTop: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {/* existing inventory yarns */}
            {standaloneYarns.map((y) => {
              const picked = selectedYarns.some(s => (s.standaloneYarnId ?? s.id) === y.id);
              return (
                <button key={y.id} onClick={() => toggleYarn(y)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', border: 'none', background: picked ? 'var(--accent)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                  {y.color && <div style={{ width: 20, height: 20, borderRadius: 999, background: y.color, flexShrink: 0, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)' }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{y.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', marginTop: 1 }}>{[y.brand, y.color, y.amount].filter(Boolean).join(' · ')}</div>
                  </div>
                  {picked && <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              );
            })}

            <button onClick={() => setShowNewYarnModal(true)} style={{ width: '100%', padding: '12px 14px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Legg til nytt garn
            </button>
          </div>
        )}

        {/* pinner */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500, marginBottom: 10 }}>Pinner</div>

          {/* selected needles */}
          {selectedNeedles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {selectedNeedles.map(n => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{n.size} – {n.type}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{[n.length, n.material].filter(Boolean).join(' · ')}</div>
                  <button onClick={() => setSelectedNeedles(prev => prev.filter(x => x.id !== n.id))} style={{ background: 'transparent', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* needle picker toggle */}
          <button onClick={() => setShowNeedlePicker(v => !v)} style={{ width: '100%', padding: '14px 16px', border: '1px dashed var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-fg)', fontSize: 13.5, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Velg fra lager eller legg til ny pinne
          </button>

          {showNeedlePicker && (
            <div style={{ marginTop: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {/* existing inventory needles */}
              {needleInventory.map((item) => {
                const picked = selectedNeedles.some(n => n.inventoryNeedleId === item.id);
                return (
                  <button key={item.id} onClick={() => toggleNeedle(item)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', border: 'none',
                    background: picked ? 'var(--accent)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                      {item.size}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{item.size} – {item.type}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', marginTop: 1 }}>
                        {[item.length, item.material, item.quantity > 1 ? `×${item.quantity}` : undefined].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {picked && <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                );
              })}

              <button onClick={() => { setNewNeedleType(craftType === 'Hekling' ? 'Heklenål' : 'Rundpinne'); setShowNewNeedleModal(true); }} style={{ width: '100%', padding: '12px 14px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Legg til ny pinne
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NEW YARN MODAL */}
      {showNewYarnModal && (
        <>
          <div onClick={() => setShowNewYarnModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'color-mix(in oklab, #000 40%, transparent)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 111, background: 'var(--bg)', borderRadius: '24px 24px 0 0', padding: '12px 20px 44px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '4px auto 18px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={() => setShowNewYarnModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted-fg)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', padding: 0 }}>Avbryt</button>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>Nytt garn</div>
              <button onClick={handleAddNewYarn} disabled={!newYarnName.trim()} style={{ background: 'transparent', border: 'none', color: newYarnName.trim() ? 'var(--primary)' : 'var(--muted-fg)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: newYarnName.trim() ? 'pointer' : 'default', padding: 0 }}>Legg til</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input autoFocus placeholder="Garnnavn *" value={newYarnName} onChange={e => setNewYarnName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddNewYarn(); if (e.key === 'Escape') setShowNewYarnModal(false); }} style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <input placeholder="Farge" value={newYarnColor} onChange={e => setNewYarnColor(e.target.value)} style={{ flex: 1, height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 15, outline: 'none' }} />
                <input placeholder="Mengde" value={newYarnAmount} onChange={e => setNewYarnAmount(e.target.value)} style={{ flex: 1, height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 15, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 2px' }}>
                <span style={{ fontSize: 14, color: 'var(--fg)' }}>Lagre til garnskapet</span>
                <button onClick={() => setSaveYarnToInventory(v => !v)} style={{ width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: saveYarnToInventory ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 3, left: saveYarnToInventory ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: 'white', transition: 'left 0.15s', display: 'block' }} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* NEW NEEDLE MODAL */}
      {showNewNeedleModal && (
        <>
          <div onClick={() => setShowNewNeedleModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'color-mix(in oklab, #000 40%, transparent)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 111, background: 'var(--bg)', borderRadius: '24px 24px 0 0', padding: '12px 20px 44px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '4px auto 18px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={() => setShowNewNeedleModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted-fg)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', padding: 0 }}>Avbryt</button>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>Ny pinne</div>
              <button onClick={handleAddNewNeedle} disabled={!newNeedleSize.trim()} style={{ background: 'transparent', border: 'none', color: newNeedleSize.trim() ? 'var(--primary)' : 'var(--muted-fg)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: newNeedleSize.trim() ? 'pointer' : 'default', padding: 0 }}>Legg til</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {NEEDLE_TYPES.map(t => (
                  <button key={t} onClick={() => setNewNeedleType(t)} style={{ height: 32, padding: '0 12px', borderRadius: 999, border: '1px solid var(--border)', background: newNeedleType === t ? 'var(--fg)' : 'var(--card)', color: newNeedleType === t ? 'var(--bg)' : 'var(--fg)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
                ))}
              </div>
              <input autoFocus placeholder="Størrelse (f.eks. 4mm) *" value={newNeedleSize} onChange={e => setNewNeedleSize(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddNewNeedle(); if (e.key === 'Escape') setShowNewNeedleModal(false); }} style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <input placeholder="Lengde" value={newNeedleLength} onChange={e => setNewNeedleLength(e.target.value)} style={{ flex: 1, height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 15, outline: 'none' }} />
                <input placeholder="Materiale" value={newNeedleMaterial} onChange={e => setNewNeedleMaterial(e.target.value)} style={{ flex: 1, height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 15, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 2px' }}>
                <span style={{ fontSize: 14, color: 'var(--fg)' }}>Lagre til pinneskapet</span>
                <button onClick={() => setSaveNeedleToInventory(v => !v)} style={{ width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: saveNeedleToInventory ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 3, left: saveNeedleToInventory ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: 'white', transition: 'left 0.15s', display: 'block' }} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* image source picker bottom sheet */}
      {showImageSourcePicker && (
        <div
          onClick={() => setShowImageSourcePicker(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 0 }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />
            <button
              type="button"
              onClick={() => { setShowImageSourcePicker(false); cameraInputRef.current?.click(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 500, color: 'var(--fg)', width: '100%', borderBottom: '1px solid var(--border)' }}
            >
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Ta bilde
            </button>
            <button
              type="button"
              onClick={() => { setShowImageSourcePicker(false); galleryInputRef.current?.click(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 500, color: 'var(--fg)', width: '100%' }}
            >
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Velg fra bibliotek
            </button>
          </div>
        </div>
      )}
    </>
  );
}
