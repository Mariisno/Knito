// Knito — shared UI primitives (icons, texture, phone shell, chip, ring)

// ========== ICONS — minimal stroke set ==========
const Icon = {
  plus: (p={}) => <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  minus: (p={}) => <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/></svg>,
  chevDown: (p={}) => <svg viewBox="0 0 24 24" width={p.s||14} height={p.s||14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
  minimize: (p={}) => <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14l6 6 6-6M6 4h12"/></svg>,
  back: (p={}) => <svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>,
  more: (p={}) => <svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>,
  search: (p={}) => <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>,
  close: (p={}) => <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  check: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5 11-11"/></svg>,
  chevron: (p={}) => <svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>,
  // category / feature — single stroke, calm
  project: (p={}) => <svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7l8-4 8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/></svg>,
  yarn: (p={}) => <svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M6 7c3 4 9 4 12 0M6 12c3 4 9 4 12 0M6 17c3 4 9 4 12 0"/></svg>,
  needle: (p={}) => <svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l6-6M8 16l8-8 5-5-1 5-8 8z"/><circle cx="6.5" cy="17.5" r="1"/></svg>,
  stats: (p={}) => <svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 19h16"/><path d="M7 19V9M12 19V5M17 19v-7"/></svg>,
  doc: (p={}) => <svg viewBox="0 0 24 24" width={p.s||22} height={p.s||22} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h5"/><path d="M9 13h6M9 17h4"/></svg>,
  open: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>,
  clock: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>,
  play: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="currentColor"><path d="M7 5v14l12-7z"/></svg>,
  pause: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="currentColor"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>,
  calendar: (p={}) => <svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>,
  filter: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>,
  grid: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>,
  list: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
  settings: (p={}) => <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>,
  camera: (p={}) => <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/></svg>,
  attach: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3l7.5-7.5"/></svg>,
  trash: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>,
  stitch: (p={}) => <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 4c-1 3-1 5 0 8s1 5 0 8M12 4c-1 3-1 5 0 8s1 5 0 8M18 4c-1 3-1 5 0 8s1 5 0 8"/></svg>,
  link: (p={}) => <svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg>,
  flower: (p={}) => <svg viewBox="0 0 24 24" width={p.s||18} height={p.s||18} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="12" cy="12" r="2.2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2L19 19M5 19l2.8-2.8M16.2 7.8L19 5"/></svg>,
};

// ========== KNIT TEXTURE — a subtle svg placeholder for images ==========
// Variants map to project.image keys
function KnitTexture({ variant = 'wool-cream', label, style = {} }) {
  const palettes = {
    'wool-cream': { bg: '#efe6d5', stroke: '#d3c3a5', label: '#8b7355' },
    'wool-rose':  { bg: '#e8cfcf', stroke: '#c9a5a2', label: '#855252' },
    'wool-oat':   { bg: '#d9cfbc', stroke: '#b5a685', label: '#6f5f49' },
    'wool-char':  { bg: '#3a342f', stroke: '#5a5149', label: '#d3c3a5' },
    'wool-sage':  { bg: '#cdd4c4', stroke: '#9da793', label: '#535c47' },
  };
  const p = palettes[variant] || palettes['wool-cream'];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: p.bg, overflow: 'hidden', ...style }}>
      <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          {/* stockinette stitch — two tiny Vs per column */}
          <pattern id={`stitch-${variant}`} x="0" y="0" width="14" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 2 L7 8 L14 2" stroke={p.stroke} strokeWidth="1" fill="none" opacity="0.55"/>
            <path d="M0 0 L7 6 L14 0" stroke={p.stroke} strokeWidth="0.6" fill="none" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill={`url(#stitch-${variant})`}/>
      </svg>
      {label && (
        <div style={{
          position: 'absolute', left: 10, bottom: 8,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 10, color: p.label, letterSpacing: 0.5,
          textTransform: 'uppercase', opacity: 0.7,
        }}>{label}</div>
      )}
    </div>
  );
}

// ========== PROGRESS RING ==========
function ProgressRing({ value = 0, size = 56, stroke = 5, color = 'var(--primary)', track = 'var(--border)', showLabel = true, labelStyle = {} }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.3,.8,.3,1)' }}/>
      </svg>
      {showLabel && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontVariantNumeric: 'tabular-nums', fontWeight: 500, fontSize: size * 0.26, color: 'var(--fg)',
          ...labelStyle,
        }}>{Math.round(value)}<span style={{ fontSize: size * 0.18, opacity: 0.5, marginLeft: 1 }}>%</span></div>
      )}
    </div>
  );
}

// ========== PROGRESS BAR (alt style via Tweaks) ==========
function ProgressBar({ value = 0, height = 6, color = 'var(--primary)', track = 'var(--border)' }) {
  return (
    <div style={{ height, background: track, borderRadius: height, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: color, borderRadius: height, transition: 'width .5s' }}/>
    </div>
  );
}

// Stitched progress bar — visible knit Vs as units
function StitchProgress({ value = 0, total = 20, color = 'var(--primary)', track = 'var(--border)' }) {
  const filled = Math.round((value / 100) * total);
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} width={8} height={10} viewBox="0 0 8 10">
          <path d="M0 2 L4 8 L8 2" stroke={i < filled ? color : track} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        </svg>
      ))}
    </div>
  );
}

// ========== CHIP ==========
function Chip({ children, active = false, onClick, icon, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 30, padding: '0 12px', borderRadius: 999,
        fontSize: 13, fontWeight: 500, letterSpacing: -0.1,
        border: '1px solid ' + (active ? 'var(--fg)' : 'var(--border)'),
        background: active ? 'var(--fg)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--fg)',
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all .15s', flexShrink: 0,
        ...style,
      }}
    >
      {icon}{children}
    </button>
  );
}

// ========== STATUS DOT ==========
function StatusDot({ status }) {
  const map = {
    'Aktiv': 'var(--primary)',
    'Planlagt': 'var(--muted-fg)',
    'På vent': '#c9856b',
    'Fullført': '#7a8a6a',
    'Arkivert': 'var(--muted-fg)',
  };
  return <span style={{ width: 6, height: 6, borderRadius: 999, background: map[status] || 'var(--muted-fg)', display: 'inline-block', flexShrink: 0 }}/>;
}

// ========== PHONE SHELL — minimal, calm, not iOS-branded ==========
function PhoneShell({ children, dark = false, width = 390, height = 844, hideStatus = false, theme }) {
  // theme is optional; falls back to `dark` flag for backward compat
  const isDark = theme ? theme === 'dark' : dark;
  return (
    <div className={isDark ? 'dark' : ''} style={{
      width, height, borderRadius: 48, overflow: 'hidden',
      position: 'relative',
      background: 'var(--bg)',
      boxShadow: '0 30px 80px -20px rgba(60,40,30,.18), 0 0 0 9px #1a1512, 0 0 0 10px #2a2420',
      fontFamily: 'var(--font-ui)', color: 'var(--fg)',
      WebkitFontSmoothing: 'antialiased',
      display: 'flex', flexDirection: 'column',
    }}>
      {!hideStatus && <StatusBar dark={isDark} />}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
      <HomeIndicator dark={isDark}/>
    </div>
  );
}

function StatusBar({ dark = false }) {
  const c = dark ? '#f5f1ed' : '#2d2520';
  return (
    <div style={{
      height: 48, flexShrink: 0, paddingTop: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 28px 0', zIndex: 5,
    }}>
      <span style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: c, letterSpacing: -0.2 }}>9:41</span>
      <div style={{ width: 100, height: 28 }}/>{/* dynamic island spacer */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', color: c }}>
        <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="7" width="2.5" height="4" rx="0.5" fill={c}/><rect x="4" y="5" width="2.5" height="6" rx="0.5" fill={c}/><rect x="8" y="3" width="2.5" height="8" rx="0.5" fill={c}/><rect x="12" y="1" width="2.5" height="10" rx="0.5" fill={c}/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11"><rect x="0.5" y="0.5" width="19" height="10" rx="2.5" fill="none" stroke={c} opacity="0.4"/><rect x="2" y="2" width="14" height="7" rx="1" fill={c}/><path d="M21 3.5v4c.6-.2 1-.8 1-2s-.4-1.8-1-2z" fill={c} opacity="0.5"/></svg>
      </div>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 108, height: 30, borderRadius: 20, background: '#0b0906',
      }}/>
    </div>
  );
}

function HomeIndicator({ dark }) {
  return (
    <div style={{
      height: 28, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8,
    }}>
      <div style={{ width: 120, height: 4.5, borderRadius: 999, background: dark ? 'rgba(245,241,237,0.7)' : 'rgba(45,37,32,0.85)' }}/>
    </div>
  );
}

// ========== APP BAR (simple, not iOS) ==========
function AppBar({ title, subtitle, left, right, transparent = false, sticky = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '10px 16px 14px',
      background: transparent ? 'transparent' : 'var(--bg)',
      position: sticky ? 'sticky' : 'relative', top: 0, zIndex: 4,
      gap: 10,
    }}>
      <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>{left}</div>
      <div style={{ flex: 1, textAlign: 'center' }}>
        {title && <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, letterSpacing: -0.2 }}>{title}</div>}
        {subtitle && <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

// ========== ICON BUTTON ==========
function IconBtn({ onClick, children, style = {}, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 36, height: 36, borderRadius: 999, border: 'none',
      background: 'transparent', color: 'var(--fg)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>{children}</button>
  );
}

// ========== BOTTOM TAB BAR ==========
function TabBar({ active, onChange, t }) {
  const items = [
    { id: 'projects', label: t.tabs.projects, icon: Icon.project },
    { id: 'yarn',     label: t.tabs.yarn,     icon: Icon.yarn },
    { id: 'needles',  label: t.tabs.needles,  icon: Icon.needle },
    { id: 'stats',    label: t.tabs.stats,    icon: Icon.stats },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
      background: 'color-mix(in oklab, var(--bg) 86%, transparent)',
      backdropFilter: 'saturate(140%) blur(18px)',
      WebkitBackdropFilter: 'saturate(140%) blur(18px)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 28,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 12px 6px' }}>
        {items.map(it => {
          const on = active === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} style={{
              flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: on ? 'var(--fg)' : 'var(--muted-fg)',
              padding: '6px 0',
            }}>
              <it.icon s={22}/>
              <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500, letterSpacing: -0.1 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, KnitTexture, ProgressRing, ProgressBar, StitchProgress, Chip, StatusDot,
  PhoneShell, AppBar, IconBtn, TabBar,
});
