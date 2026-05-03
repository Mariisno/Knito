import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Yarn, YarnWeight } from '../types/knitting';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

export type YarnFormValue = Partial<Yarn>;

interface YarnFormFieldsProps {
  value: YarnFormValue;
  onChange: (next: YarnFormValue) => void;
  uploadingImg: boolean;
  onUploadImage: (file: File, setUrl: (url: string) => void) => Promise<void> | void;
}

export function YarnFormFields({ value, onChange, uploadingImg, onUploadImage }: YarnFormFieldsProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [imageSourceOpen, setImageSourceOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const setUrl = (url: string) => onChange({ ...value, imageUrl: url });
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUploadImage(file, setUrl);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Garnnavn *</Label>
        <Input
          value={value.name || ''}
          onChange={e => onChange({ ...value, name: e.target.value })}
          placeholder="F.eks. Sandnes Alpakka"
        />
      </div>

      <div className="space-y-2">
        <Label>Antall (nøster)</Label>
        <Input
          type="number"
          min={0}
          value={value.quantity ?? 1}
          onChange={e => {
            const v = e.target.value;
            onChange({ ...value, quantity: v === '' ? undefined : Math.max(0, parseInt(v, 10) || 0) });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Bilde</Label>
        <div className="flex items-center gap-3">
          <div style={{
            width: 72, height: 72, borderRadius: 12, flexShrink: 0,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {value.imageUrl ? (
              <img src={value.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="var(--muted-fg)" strokeWidth="1.4" strokeLinecap="round" opacity={0.6}>
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <circle cx="9" cy="11" r="1.6"/>
                <path d="M21 17l-6-5-9 7"/>
              </svg>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
            <input ref={galleryInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImageSourceOpen(true)}
              disabled={uploadingImg}
            >
              {uploadingImg ? 'Laster opp…' : (value.imageUrl ? 'Bytt bilde' : 'Last opp bilde')}
            </Button>
            {value.imageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...value, imageUrl: undefined })}
              >
                Fjern bilde
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Kommentar</Label>
        <Textarea
          value={value.notes || ''}
          onChange={e => onChange({ ...value, notes: e.target.value })}
          placeholder="F.eks. Kjøpt på salg..."
          className="min-h-[60px] resize-none"
        />
      </div>

      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '8px 0', background: 'transparent', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              color: 'var(--muted-fg)',
            }}
          >
            <span>{detailsOpen ? 'Skjul detaljer' : 'Vis flere detaljer'}</span>
            <ChevronDown
              size={16}
              style={{ transform: detailsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="space-y-2">
            <Label>Merke</Label>
            <Input
              value={value.brand || ''}
              onChange={e => onChange({ ...value, brand: e.target.value })}
              placeholder="F.eks. Sandnes Garn"
            />
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div className="space-y-2">
              <Label>Farge</Label>
              <Input
                value={value.color || ''}
                onChange={e => onChange({ ...value, color: e.target.value })}
                placeholder="F.eks. Natur"
              />
            </div>
            <div className="space-y-2">
              <Label>Tykkelse</Label>
              <select
                value={value.weight || ''}
                onChange={e => onChange({ ...value, weight: (e.target.value || undefined) as YarnWeight | undefined })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Velg...</option>
                {['Lace','Fingering','Sport','DK','Worsted','Aran','Bulky','Super Bulky'].map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div className="space-y-2">
              <Label>Fiberinnhold</Label>
              <Input
                value={value.fiberContent || ''}
                onChange={e => onChange({ ...value, fiberContent: e.target.value })}
                placeholder="100% Ull"
              />
            </div>
            <div className="space-y-2">
              <Label>Løpelengde</Label>
              <Input
                value={value.yardage || ''}
                onChange={e => onChange({ ...value, yardage: e.target.value })}
                placeholder="200m / 50g"
              />
            </div>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div className="space-y-2">
              <Label>Fargebad</Label>
              <Input
                value={value.dyeLot || ''}
                onChange={e => onChange({ ...value, dyeLot: e.target.value })}
                placeholder="Lot 2345"
              />
            </div>
            <div className="space-y-2">
              <Label>Mengde</Label>
              <Input
                value={value.amount || ''}
                onChange={e => onChange({ ...value, amount: e.target.value })}
                placeholder="F.eks. 200g"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Pris (kr)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={value.price ?? ''}
              onChange={e => {
                const v = e.target.value;
                onChange({ ...value, price: v === '' ? undefined : Math.max(0, parseFloat(v) || 0) });
              }}
              placeholder="0"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {imageSourceOpen && (
        <div
          onClick={() => setImageSourceOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 0 }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />
            <button
              type="button"
              onClick={() => { setImageSourceOpen(false); cameraInputRef.current?.click(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 500, color: 'var(--fg)', width: '100%', borderBottom: '1px solid var(--border)' }}
            >
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Ta bilde
            </button>
            <button
              type="button"
              onClick={() => { setImageSourceOpen(false); galleryInputRef.current?.click(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 500, color: 'var(--fg)', width: '100%' }}
            >
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Velg fra bibliotek
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
