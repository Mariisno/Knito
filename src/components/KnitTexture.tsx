import { useId } from 'react';

const PALETTES: Record<string, { bg: string; stroke: string; label: string }> = {
  'wool-cream': { bg: '#efe6d5', stroke: '#d3c3a5', label: '#8b7355' },
  'wool-rose':  { bg: '#e8cfcf', stroke: '#c9a5a2', label: '#855252' },
  'wool-oat':   { bg: '#d9cfbc', stroke: '#b5a685', label: '#6f5f49' },
  'wool-char':  { bg: '#3a342f', stroke: '#5a5149', label: '#d3c3a5' },
  'wool-sage':  { bg: '#cdd4c4', stroke: '#9da793', label: '#535c47' },
};

// Pick a palette deterministically from a project id string
export function paletteForId(id: string): string {
  const keys = Object.keys(PALETTES);
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return keys[Math.abs(hash) % keys.length];
}

interface KnitTextureProps {
  variant?: string;
  style?: React.CSSProperties;
}

export function KnitTexture({ variant = 'wool-cream', style = {} }: KnitTextureProps) {
  const p = PALETTES[variant] || PALETTES['wool-cream'];
  const uid = useId();
  const patternId = `stitch-${variant}-${uid}`;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: p.bg, overflow: 'hidden', ...style }}>
      <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id={patternId} x="0" y="0" width="14" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 2 L7 8 L14 2" stroke={p.stroke} strokeWidth="1" fill="none" opacity="0.55"/>
            <path d="M0 0 L7 6 L14 0" stroke={p.stroke} strokeWidth="0.6" fill="none" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill={`url(#${patternId})`}/>
      </svg>
    </div>
  );
}
