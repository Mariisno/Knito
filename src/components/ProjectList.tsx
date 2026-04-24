import { useState, useMemo, useTransition } from 'react';
import type { KnittingProject, ProjectStatus } from '../types/knitting';
import { KnitTexture, paletteForId } from './KnitTexture';
import { ProgressBar } from './ProgressBar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Moon, Sun, Download, LogOut, Sparkles, Shield, CircleUserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ReleaseNotesDialog, hasUnseenRelease, markVersionAsSeen } from './ReleaseNotesDialog';

// ---------- Icons ----------
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18"/>
  </svg>
);
const GridIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/>
    <rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const DocIcon = () => (
  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
    <path d="M14 3v4h5"/><path d="M9 13h6M9 17h4"/>
  </svg>
);

// ---------- Status dot ----------
const STATUS_COLORS: Record<string, string> = {
  'Aktiv':    'var(--primary)',
  'Planlagt': 'var(--muted-fg)',
  'På vent':  '#c9856b',
  'Fullført': '#7a8a6a',
  'Arkivert': 'var(--muted-fg)',
};

function StatusDot({ status }: { status: string }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: 999,
      background: STATUS_COLORS[status] || 'var(--muted-fg)',
      display: 'inline-block', flexShrink: 0,
    }}/>
  );
}

// ---------- Section header ----------
function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2,
      textTransform: 'uppercase', padding: '16px 2px 10px', fontWeight: 500,
    }}>{label}</div>
  );
}

// ---------- Project row (list view) ----------
interface ProjectRowProps {
  project: KnittingProject;
  onOpen: () => void;
  onProgressChange?: (id: string, v: number) => void;
}

function ProjectRow({ project, onOpen, onProgressChange }: ProjectRowProps) {
  const palette = paletteForId(project.id);
  const imageUrl = project.images?.[0];

  return (
    <button
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'stretch', gap: 14, width: '100%',
        padding: 14, marginBottom: 10,
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
        cursor: 'pointer', textAlign: 'left', color: 'var(--fg)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: 68, height: 68, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <KnitTexture variant={palette} />
        )}
        {project.recipe && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            width: 20, height: 20, borderRadius: 6,
            background: 'color-mix(in oklab, var(--bg) 85%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg)',
          }}>
            <DocIcon />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot status={project.status} />
            <span style={{ fontSize: 10.5, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              {project.status}
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500,
            letterSpacing: -0.2, marginTop: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{project.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <div style={{ flex: 1 }}>
            <ProgressBar value={project.progress} />
          </div>
          <div style={{
            fontVariantNumeric: 'tabular-nums', fontSize: 12.5, fontWeight: 600,
            color: 'var(--fg)', minWidth: 34, textAlign: 'right',
          }}>{project.progress}%</div>
        </div>
      </div>
    </button>
  );
}

// ---------- Project grid card ----------
function ProjectGridCard({ project, onOpen }: { project: KnittingProject; onOpen: () => void }) {
  const palette = paletteForId(project.id);
  const imageUrl = project.images?.[0];

  return (
    <button
      onClick={onOpen}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
        overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0,
        display: 'flex', flexDirection: 'column', color: 'var(--fg)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ aspectRatio: '1 / 1', width: '100%', position: 'relative' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <KnitTexture variant={palette} />
        )}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <ProgressRingSmall value={project.progress} />
        </div>
        {project.recipe && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            height: 22, padding: '0 8px', borderRadius: 999,
            background: 'color-mix(in oklab, var(--bg) 88%, transparent)',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10.5, fontWeight: 500, color: 'var(--fg)',
          }}>
            <DocIcon /> PDF
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot status={project.status} />
          <span style={{ fontSize: 10, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {project.status}
          </span>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 500, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{project.name}</div>
        <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 11, color: 'var(--muted-fg)', marginTop: 3 }}>
          {project.progress}%
        </div>
      </div>
    </button>
  );
}

// Small SVG progress ring for grid cards
function ProgressRingSmall({ value }: { value: number }) {
  const size = 40, stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--primary)" strokeWidth={stroke} fill="none"
              strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"/>
    </svg>
  );
}

// ---------- Empty state ----------
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ padding: '60px 30px', textAlign: 'center', color: 'var(--muted-fg)' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 999, margin: '0 auto 16px',
        background: 'var(--accent)', color: 'var(--fg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7l8-4 8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/>
        </svg>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--fg)', marginBottom: 6 }}>
        Ingen prosjekter ennå
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, maxWidth: 240, margin: '0 auto 18px' }}>
        Begynn på ditt første strikkeprosjekt
      </div>
      <button
        onClick={onNew}
        style={{
          height: 40, padding: '0 18px', borderRadius: 999,
          background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
        }}
      >
        Nytt prosjekt
      </button>
    </div>
  );
}

// ---------- Main component ----------
interface ProjectListProps {
  projects: KnittingProject[];
  onSelectProject: (id: string) => void;
  onProgressChange?: (projectId: string, newProgress: number) => void;
  onNewProject: () => void;
  onSignOut: () => void;
  onToggleTheme: () => void;
  theme: string;
  onExport: () => void;
  onPrivacy: () => void;
}

export function ProjectList({
  projects, onSelectProject, onProgressChange,
  onNewProject, onSignOut, onToggleTheme, theme, onExport, onPrivacy,
}: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'Alle'>('Alle');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [, startTransition] = useTransition();
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [unseenRelease, setUnseenRelease] = useState(hasUnseenRelease);
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : user?.email?.split('@')[0] ?? '';

  const FILTERS: Array<{ id: ProjectStatus | 'Alle'; label: string }> = [
    { id: 'Alle',     label: 'Alle' },
    { id: 'Aktiv',    label: 'Aktive' },
    { id: 'På vent',  label: 'På vent' },
    { id: 'Planlagt', label: 'Planlagt' },
    { id: 'Fullført', label: 'Fullført' },
  ];

  const filtered = useMemo(() => {
    let list = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.recipe?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'Alle') {
      list = list.filter(p => p.status !== 'Arkivert');
    } else {
      list = list.filter(p => p.status === statusFilter);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects, searchQuery, statusFilter]);

  const active = filtered.filter(p => p.status === 'Aktiv');
  const other  = filtered.filter(p => p.status !== 'Aktiv');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))', paddingBottom: '8px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase' }}>
              Knito
            </div>
            {firstName && (
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500, letterSpacing: 0.3 }}>
                Hei, {firstName}!
              </div>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>
            Prosjekter
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{
              width: 36, height: 36, borderRadius: 999,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--fg)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <CircleUserRound size={18} />
              {unseenRelease && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 7, height: 7, borderRadius: 999,
                  background: 'var(--primary)',
                  border: '1.5px solid var(--bg)',
                }} />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => {
              setReleaseNotesOpen(true);
              setUnseenRelease(false);
              markVersionAsSeen();
            }}>
              <Sparkles className="mr-2 h-4 w-4" />
              Hva er nytt?
              {unseenRelease && (
                <span style={{
                  marginLeft: 'auto',
                  width: 7, height: 7, borderRadius: 999,
                  background: 'var(--primary)', flexShrink: 0,
                }} />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleTheme}>
              {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
              {theme === 'light' ? 'Mørkt tema' : 'Lyst tema'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Last ned sikkerhetskopi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrivacy}>
              <Shield className="mr-2 h-4 w-4" />
              Personvern og vilkår
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logg ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ReleaseNotesDialog open={releaseNotesOpen} onOpenChange={(val) => {
          setReleaseNotesOpen(val);
          if (!val) setUnseenRelease(false);
        }} />
      </div>

      {/* Search */}
      <div style={{ padding: '10px 20px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          height: 40, padding: '0 14px',
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
          color: 'var(--muted-fg)',
        }}>
          <SearchIcon />
          <input
            value={searchQuery}
            onChange={e => { const v = e.target.value; startTransition(() => setSearchQuery(v)); }}
            placeholder="Søk i prosjekter…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: 'var(--fg)', fontFamily: 'var(--font-ui)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', padding: 0 }}
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Filters + view toggle */}
      <div style={{ padding: '4px 20px 10px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => startTransition(() => setStatusFilter(f.id))}
            style={{
              display: 'inline-flex', alignItems: 'center',
              height: 30, padding: '0 12px', borderRadius: 999,
              fontSize: 13, fontWeight: 500, letterSpacing: -0.1,
              border: '1px solid ' + (statusFilter === f.id ? 'var(--fg)' : 'var(--border)'),
              background: statusFilter === f.id ? 'var(--fg)' : 'transparent',
              color: statusFilter === f.id ? 'var(--bg)' : 'var(--fg)',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              fontFamily: 'var(--font-ui)',
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setView(v => v === 'list' ? 'grid' : 'list')}
          style={{
            background: 'transparent', border: 'none', color: 'var(--muted-fg)',
            cursor: 'pointer', display: 'flex', padding: 4, flexShrink: 0,
          }}
        >
          {view === 'list' ? <GridIcon /> : <ListIcon />}
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20, WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' } as React.CSSProperties}>
        {filtered.length === 0 ? (
          <EmptyState onNew={onNewProject} />
        ) : view === 'grid' ? (
          <div style={{ padding: '4px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {filtered.map(p => (
              <ProjectGridCard key={p.id} project={p} onOpen={() => onSelectProject(p.id)} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '0 20px' }}>
            {active.length > 0 && (
              <>
                <SectionHeader label="Aktive" />
                {active.map(p => (
                  <ProjectRow key={p.id} project={p} onOpen={() => onSelectProject(p.id)} onProgressChange={onProgressChange} />
                ))}
              </>
            )}
            {other.length > 0 && (
              <>
                <SectionHeader label="Andre" />
                {other.map(p => (
                  <ProjectRow key={p.id} project={p} onOpen={() => onSelectProject(p.id)} onProgressChange={onProgressChange} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={onNewProject}
        style={{
          position: 'absolute', right: 20, bottom: 80, zIndex: 25,
          height: 54, padding: '0 20px 0 16px', borderRadius: 999,
          background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none',
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          fontFamily: 'var(--font-ui)', fontSize: 14.5, fontWeight: 600, letterSpacing: -0.2,
          boxShadow: '0 8px 24px -6px color-mix(in oklab, var(--primary) 45%, transparent), 0 2px 6px rgba(0,0,0,.08)',
        }}
      >
        <PlusIcon /> Nytt prosjekt
      </button>
    </div>
  );
}
