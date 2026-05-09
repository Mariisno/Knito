import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface DrawingCanvasProps {
  open: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void> | void;
  backgroundUrl?: string;
  saving?: boolean;
}

const MAX_EDGE = 1600;
const BLANK_WIDTH = 1200;
const BLANK_HEIGHT = 1600;
const HISTORY_LIMIT = 30;

const PRESET_COLORS = [
  '#1a1a1a', '#ffffff', '#d97757', '#c9856b',
  '#5a7a6a', '#7a8a6a', '#3b6ea8', '#a23b6a',
];

const overlayBtn: React.CSSProperties = {
  height: 38,
  minWidth: 38,
  padding: '0 10px',
  borderRadius: 10,
  border: 'none',
  background: 'color-mix(in oklab, var(--bg) 88%, transparent)',
  backdropFilter: 'blur(12px)',
  color: 'var(--fg)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 500,
};

const activeBtn: React.CSSProperties = {
  ...overlayBtn,
  background: 'var(--primary)',
  color: 'var(--primary-fg, #fff)',
};

const disabledBtn: React.CSSProperties = {
  ...overlayBtn,
  opacity: 0.4,
  cursor: 'default',
};

export function DrawingCanvas({ open, onClose, onSave, backgroundUrl, saving = false }: DrawingCanvasProps) {
  const { t } = useTranslation();
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const historyRef = useRef<ImageData[]>([]);
  const redoRef = useRef<ImageData[]>([]);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#1a1a1a');
  const [thickness, setThickness] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [bgReady, setBgReady] = useState(false);
  const [bgError, setBgError] = useState(false);

  const updateHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(redoRef.current.length > 0);
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = strokesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snap);
    if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
    redoRef.current = [];
    updateHistoryFlags();
  }, [updateHistoryFlags]);

  const sizeCanvases = useCallback((w: number, h: number) => {
    const bg = bgCanvasRef.current;
    const strokes = strokesCanvasRef.current;
    if (!bg || !strokes) return;
    bg.width = w;
    bg.height = h;
    strokes.width = w;
    strokes.height = h;
  }, []);

  // Initialize when opened
  useEffect(() => {
    if (!open) return;

    historyRef.current = [];
    redoRef.current = [];
    setBgReady(false);
    setBgError(false);
    setTool('pen');
    setShowColorPicker(false);

    const initialize = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
      sizeCanvases(w, h);
      const bg = bgCanvasRef.current;
      const strokes = strokesCanvasRef.current;
      if (!bg || !strokes) return;
      const bgCtx = bg.getContext('2d');
      const strokesCtx = strokes.getContext('2d');
      if (!bgCtx || !strokesCtx) return;
      bgCtx.fillStyle = '#ffffff';
      bgCtx.fillRect(0, 0, w, h);
      draw(bgCtx);
      strokesCtx.clearRect(0, 0, w, h);
      const empty = strokesCtx.getImageData(0, 0, w, h);
      historyRef.current = [empty];
      updateHistoryFlags();
      setBgReady(true);
    };

    if (backgroundUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
        const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1;
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        initialize(w, h, ctx => ctx.drawImage(img, 0, 0, w, h));
      };
      img.onerror = () => {
        setBgError(true);
        initialize(BLANK_WIDTH, BLANK_HEIGHT, () => {});
      };
      img.src = backgroundUrl;
    } else {
      initialize(BLANK_WIDTH, BLANK_HEIGHT, () => {});
    }
  }, [open, backgroundUrl, sizeCanvases, updateHistoryFlags]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = strokesCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const beginStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!bgReady) return;
    const canvas = strokesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = getCanvasPoint(e);
    lastPointRef.current = p;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = thickness * (canvas.width / canvas.clientWidth);
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
    // dot for taps
    ctx.beginPath();
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const continueStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = strokesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const last = lastPointRef.current;
    const p = getCanvasPoint(e);
    if (!last) {
      lastPointRef.current = p;
      return;
    }
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = strokesCanvasRef.current;
    if (canvas) {
      try { canvas.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    drawingRef.current = false;
    lastPointRef.current = null;
    pushHistory();
  };

  const handleUndo = () => {
    const canvas = strokesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (historyRef.current.length <= 1) return;
    const current = historyRef.current.pop()!;
    redoRef.current.push(current);
    const prev = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
    updateHistoryFlags();
  };

  const handleRedo = () => {
    const canvas = strokesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(next);
    ctx.putImageData(next, 0, 0);
    updateHistoryFlags();
  };

  const handleClear = () => {
    if (historyRef.current.length <= 1) return;
    if (!window.confirm(t('drawing.confirmClear'))) return;
    const canvas = strokesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pushHistory();
  };

  const hasUnsavedWork = () => historyRef.current.length > 1;

  const handleClose = () => {
    if (saving) return;
    if (hasUnsavedWork() && !window.confirm(t('drawing.confirmDiscard'))) return;
    onClose();
  };

  const handleSave = async () => {
    if (saving) return;
    const bg = bgCanvasRef.current;
    const strokes = strokesCanvasRef.current;
    if (!bg || !strokes) return;
    const out = document.createElement('canvas');
    out.width = bg.width;
    out.height = bg.height;
    const outCtx = out.getContext('2d');
    if (!outCtx) return;
    try {
      outCtx.drawImage(bg, 0, 0);
      outCtx.drawImage(strokes, 0, 0);
      const blob: Blob | null = await new Promise(resolve => out.toBlob(b => resolve(b), 'image/png'));
      if (!blob) return;
      const file = new File([blob], `tegning-${Date.now()}.png`, { type: 'image/png' });
      await onSave(file);
    } catch {
      // SecurityError (CORS-tainted canvas) or other failure — onSave path shows toast
    }
  };

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, saving]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'color-mix(in oklab, #000 88%, transparent)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top toolbar */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: 'calc(8px + env(safe-area-inset-top)) 12px 8px',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={handleClose} title={t('drawing.close')} aria-label={t('drawing.close')} style={overlayBtn}>
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleSave}
          disabled={saving || !bgReady}
          title={t('drawing.save')}
          style={{ ...overlayBtn, background: 'var(--primary)', color: '#fff', opacity: (saving || !bgReady) ? 0.6 : 1 }}
        >
          {saving
            ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
            : <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          }
          <span>{t('drawing.save')}</span>
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={wrapRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          position: 'relative',
        }}
      >
        {!bgReady && (
          <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
            <span>{t('common.loading')}</span>
          </div>
        )}
        <div
          style={{
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '100%',
            display: bgReady ? 'block' : 'none',
            boxShadow: '0 24px 64px -12px rgba(0,0,0,0.7)',
            borderRadius: 6,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <canvas
            ref={bgCanvasRef}
            style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100dvh - 200px)', width: 'auto', height: 'auto' }}
          />
          <canvas
            ref={strokesCanvasRef}
            onPointerDown={beginStroke}
            onPointerMove={continueStroke}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={e => { if (drawingRef.current) endStroke(e); }}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              touchAction: 'none',
              cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            }}
          />
        </div>
        {bgError && (
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            background: 'color-mix(in oklab, var(--bg) 90%, transparent)',
            color: 'var(--fg)', padding: '6px 12px', borderRadius: 8, fontSize: 12,
            backdropFilter: 'blur(12px)',
          }}>
            {t('toasts.imageUploadFailed')}
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px calc(8px + env(safe-area-inset-bottom))',
          flexWrap: 'wrap', justifyContent: 'center',
        }}
      >
        <button
          onClick={() => { setTool('pen'); setShowColorPicker(false); }}
          title={t('drawing.pen')}
          aria-label={t('drawing.pen')}
          style={tool === 'pen' ? activeBtn : overlayBtn}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
          </svg>
        </button>
        <button
          onClick={() => { setTool('eraser'); setShowColorPicker(false); }}
          title={t('drawing.eraser')}
          aria-label={t('drawing.eraser')}
          style={tool === 'eraser' ? activeBtn : overlayBtn}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20H7L3 16a2 2 0 0 1 0-2.8l9-9a2 2 0 0 1 2.8 0l5 5a2 2 0 0 1 0 2.8L11 20"/><line x1="18" y1="13" x2="9" y2="4"/>
          </svg>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowColorPicker(v => !v)}
            title={t('drawing.color')}
            aria-label={t('drawing.color')}
            style={overlayBtn}
          >
            <span style={{
              width: 18, height: 18, borderRadius: 999,
              background: color, border: '1px solid color-mix(in oklab, var(--fg) 25%, transparent)',
            }} />
          </button>
          {showColorPicker && (
            <>
              <div
                onClick={() => setShowColorPicker(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 5 }}
              />
              <div
                style={{
                  position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
                  background: 'color-mix(in oklab, var(--bg) 95%, transparent)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border)', borderRadius: 12,
                  padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6,
                  width: 184, zIndex: 6,
                }}
              >
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setColor(c); setShowColorPicker(false); setTool('pen'); }}
                    aria-label={c}
                    style={{
                      width: 32, height: 32, borderRadius: 999,
                      border: c.toLowerCase() === color.toLowerCase()
                        ? '2px solid var(--fg)'
                        : '1px solid var(--border)',
                      background: c, cursor: 'pointer',
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => { setColor(e.target.value); setTool('pen'); }}
                  style={{ width: 32, height: 32, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
              </div>
            </>
          )}
        </div>

        <label style={{ ...overlayBtn, padding: '0 12px', cursor: 'default' }}>
          <span style={{ fontSize: 11, color: 'var(--muted-fg)' }}>{t('drawing.thickness')}</span>
          <input
            type="range"
            min={1}
            max={32}
            step={1}
            value={thickness}
            onChange={e => setThickness(parseInt(e.target.value, 10))}
            style={{ width: 96 }}
          />
          <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, minWidth: 18, textAlign: 'right' }}>{thickness}</span>
        </label>

        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title={t('drawing.undo')}
          aria-label={t('drawing.undo')}
          style={canUndo ? overlayBtn : disabledBtn}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>
          </svg>
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title={t('drawing.redo')}
          aria-label={t('drawing.redo')}
          style={canRedo ? overlayBtn : disabledBtn}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>
          </svg>
        </button>
        <button
          onClick={handleClear}
          disabled={!canUndo}
          title={t('drawing.clear')}
          aria-label={t('drawing.clear')}
          style={canUndo ? overlayBtn : disabledBtn}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
