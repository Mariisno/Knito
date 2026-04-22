import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { KnittingProject, Yarn } from '../types/knitting';
import * as api from '../utils/api';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProject: (project: Omit<KnittingProject, 'id' | 'createdAt'>) => void;
  accessToken: string;
  standaloneYarns: Yarn[];
}

const CATEGORIES = ['Genser', 'Sjal', 'Sokker', 'Kofte', 'Teppe', 'Lue', 'Annet'];

export function AddProjectDialog({ open, onOpenChange, onAddProject, accessToken, standaloneYarns }: AddProjectDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedPdf, setUploadedPdf] = useState<{ url: string; name: string } | null>(null);
  const [selectedYarns, setSelectedYarns] = useState<Yarn[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showYarnPicker, setShowYarnPicker] = useState(false);

  const reset = () => {
    setName('');
    setCategory('');
    setUploadedImages([]);
    setUploadedPdf(null);
    setSelectedYarns([]);
    setShowYarnPicker(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onAddProject({
      name: name.trim(),
      category: category || undefined,
      progress: 0,
      status: 'Planlagt',
      images: uploadedImages,
      yarns: selectedYarns.map(y => ({ ...y, id: crypto.randomUUID(), standaloneYarnId: y.id })),
      needles: [],
      counters: [],
      ...(uploadedPdf ? { pattern: { pdfUrl: uploadedPdf.url, pdfName: uploadedPdf.name } } : {}),
    });
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
    setSelectedYarns(prev =>
      prev.some(y => y.id === yarn.id)
        ? prev.filter(y => y.id !== yarn.id)
        : [...prev, yarn]
    );
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
            Avbryt
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>Nytt prosjekt</div>
          <button onClick={handleSave} disabled={!name.trim()} style={{ background: 'transparent', border: 'none', color: name.trim() ? 'var(--primary)' : 'var(--muted-fg)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default', padding: 0 }}>
            Lagre
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {/* bilde */}
          <label style={{ padding: '20px 16px', background: 'var(--card)', border: uploadedImages.length ? '1px solid var(--primary)' : '1px solid var(--border)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: uploadingImage ? 'not-allowed' : 'pointer', opacity: uploadingImage ? 0.6 : 1 }}>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ display: 'none' }} />
            {uploadingImage
              ? <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: 'var(--muted-fg)' }} />
              : uploadedImages.length
                ? <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden' }}><img src={uploadedImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                : <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="var(--muted-fg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            }
            <span style={{ fontSize: 12.5, fontWeight: 500, color: uploadedImages.length ? 'var(--primary)' : 'var(--muted-fg)' }}>
              {uploadedImages.length ? `${uploadedImages.length} bilde${uploadedImages.length > 1 ? 'r' : ''}` : 'Legg til bilde'}
            </span>
          </label>

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
        {standaloneYarns.length > 0 ? (
          <>
            <button onClick={() => setShowYarnPicker(v => !v)} style={{ width: '100%', padding: '14px 16px', border: '1px dashed var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-fg)', fontSize: 13.5, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Velg fra lager eller legg til nytt
            </button>
            {showYarnPicker && (
              <div style={{ marginTop: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                {standaloneYarns.map((y, i) => {
                  const picked = selectedYarns.some(s => s.id === y.id);
                  return (
                    <button key={y.id} onClick={() => toggleYarn(y)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', border: 'none', background: picked ? 'var(--accent)' : 'transparent',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{y.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', marginTop: 1 }}>{[y.brand, y.color, y.amount].filter(Boolean).join(' · ')}</div>
                      </div>
                      {picked && <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '14px 16px', border: '1px dashed var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-fg)', fontSize: 13.5 }}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Velg fra lager eller legg til nytt
          </div>
        )}
      </div>
    </>
  );
}
