import { useState, useMemo } from 'react';
import type { KnittingProject, ProjectStatus } from '../types/knitting';
import { KnitTexture, paletteForId } from './KnitTexture';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './ui/dropdown-menu';
import { Moon, Sun, Download, LogOut, Sparkles, Shield, CircleUserRound, RefreshCw, MessageSquareWarning, Palette, Globe, Play, Pause, Clock, CheckCircle2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { ReleaseNotesDialog, hasUnseenRelease, markVersionAsSeen } from './ReleaseNotesDialog';
import { LATEST_VERSION } from '../data/changelog';
import { SUPPORTED_LANGUAGES, type Language } from '../i18n';

type V3Filter = 'Aktiv' | 'På vent' | 'Planlagt' | 'Fullført';

const FILTERS: Array<{ id: V3Filter; tKey: string; Icon: typeof Play }> = [
  { id: 'Aktiv', tKey: 'statusFilter.Aktiv', Icon: Play },
  { id: 'På vent', tKey: 'statusFilter.På vent', Icon: Pause },
  { id: 'Planlagt', tKey: 'statusFilter.Planlagt', Icon: Clock },
  { id: 'Fullført', tKey: 'statusFilter.Fullført', Icon: CheckCircle2 },
];

const COUNT_KEY: Record<V3Filter, string> = {
  'Aktiv': 'projects.countActive',
  'På vent': 'projects.countPaused',
  'Planlagt': 'projects.countPlanned',
  'Fullført': 'projects.countCompleted',
};

interface ProjectListV3Props {
  projects: KnittingProject[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onSignOut: () => void;
  onToggleTheme: () => void;
  theme: string;
  onExport: () => void;
  onPrivacy: () => void;
  onFeedback: () => void;
  designVersion?: 'v1' | 'v2' | 'v3';
  onToggleDesignVersion?: () => void;
}

function ProjectsMenu({
  onSignOut, onToggleTheme, theme, onExport, onPrivacy, onFeedback,
  designVersion, onToggleDesignVersion,
}: Pick<ProjectListV3Props, 'onSignOut' | 'onToggleTheme' | 'theme' | 'onExport' | 'onPrivacy' | 'onFeedback' | 'designVersion' | 'onToggleDesignVersion'>) {
  const { t, language, setLanguage } = useTranslation();
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [unseenRelease, setUnseenRelease] = useState(hasUnseenRelease);
  type UpdateState = 'idle' | 'checking' | 'up-to-date' | 'update-available' | 'error';
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  async function checkForUpdate() {
    setUpdateState('checking');
    try {
      const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json() as { version: string };
      setServerVersion(data.version);
      setUpdateState(data.version !== LATEST_VERSION ? 'update-available' : 'up-to-date');
    } catch {
      setUpdateState('error');
    }
  }

  const designToggleLabel = designVersion === 'v1'
    ? t('settings.tryDesignV2')
    : designVersion === 'v2'
      ? t('settings.tryDesignV3')
      : t('settings.useDesignV1FromV3');

  return (
    <>
      <DropdownMenu onOpenChange={(open) => { if (!open) setUpdateState('idle'); }}>
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
            {t('settings.whatsNew')}
            {unseenRelease && (
              <span style={{
                marginLeft: 'auto',
                width: 7, height: 7, borderRadius: 999,
                background: 'var(--primary)', flexShrink: 0,
              }} />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() => { if (updateState !== 'checking') checkForUpdate(); }}
            disabled={updateState === 'checking'}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {updateState === 'idle' && t('settings.checkForUpdates')}
            {updateState === 'checking' && t('settings.checking')}
            {updateState === 'up-to-date' && t('settings.upToDate', { version: LATEST_VERSION })}
            {updateState === 'update-available' && t('settings.updateAvailable')}
            {updateState === 'error' && t('settings.updateError')}
          </DropdownMenuItem>
          {updateState === 'update-available' && (
            <DropdownMenuItem onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" style={{ color: 'var(--primary)' }} />
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {t('settings.loadNewVersion', { version: serverVersion ?? '' })}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onToggleTheme}>
            {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
            {theme === 'light' ? t('settings.darkTheme') : t('settings.lightTheme')}
          </DropdownMenuItem>
          {onToggleDesignVersion && (
            <DropdownMenuItem onClick={onToggleDesignVersion}>
              <Palette className="mr-2 h-4 w-4" />
              {designToggleLabel}
              <span style={{
                marginLeft: 'auto',
                fontSize: 10,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'var(--muted-fg)',
                fontWeight: 600,
              }}>
                {designVersion}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Globe className="mr-2 h-4 w-4" />
              {t('settings.language')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => setLanguage(code as Language)}
                  className={language === code ? 'bg-accent' : undefined}
                >
                  <span style={{ fontWeight: language === code ? 600 : 400 }}>{label}</span>
                  {language === code && <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('settings.downloadBackup')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPrivacy}>
            <Shield className="mr-2 h-4 w-4" />
            {t('settings.privacyAndTerms')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onFeedback}>
            <MessageSquareWarning className="mr-2 h-4 w-4" />
            {t('settings.feedback')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            {t('settings.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReleaseNotesDialog open={releaseNotesOpen} onOpenChange={(val) => {
        setReleaseNotesOpen(val);
        if (!val) setUnseenRelease(false);
      }} />
    </>
  );
}

function ProjectCardV3({ project, onOpen }: { project: KnittingProject; onOpen: () => void }) {
  const palette = paletteForId(project.id);
  const imageUrl = project.images?.[0];
  const { t } = useTranslation();
  const subtitle = project.category ?? t(`status.${project.status}`);

  return (
    <button
      onClick={onOpen}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20,
        overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0,
        display: 'flex', flexDirection: 'column', color: 'var(--fg)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ aspectRatio: '1 / 1', width: '100%', position: 'relative', background: 'var(--accent)' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <KnitTexture variant={palette} />
        )}
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{project.name}</div>
        <div style={{
          fontSize: 12, color: 'var(--muted-fg)', marginTop: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{subtitle}</div>
      </div>
    </button>
  );
}

function EmptyV3({ onNew, filter }: { onNew: () => void; filter: V3Filter }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding: 'clamp(40px, 12vw, 60px) clamp(20px, 6vw, 30px)', textAlign: 'center', color: 'var(--muted-fg)' }}>
      <div style={{
        width: 88, height: 88, borderRadius: 22, margin: '0 auto 18px',
        background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--fg)',
      }}>
        <svg viewBox="0 0 24 24" width={44} height={44} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="6" />
          <path d="M5 8l3 3M16 7l3-3M19 4l-2 2M14 19l3 3" />
        </svg>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--fg)', marginBottom: 6 }}>
        {t('projects.emptyTitle')}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, maxWidth: 260, margin: '0 auto 18px' }}>
        {t('projects.emptyDescription')}
      </div>
      <button
        onClick={onNew}
        style={{
          height: 40, padding: '0 18px', borderRadius: 999,
          background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
        }}
      >
        {t('projects.newProject')}
      </button>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {t(`statusFilter.${filter}`)}
      </div>
    </div>
  );
}

export function ProjectListV3({
  projects, onSelectProject, onNewProject,
  onSignOut, onToggleTheme, theme, onExport, onPrivacy, onFeedback,
  designVersion, onToggleDesignVersion,
}: ProjectListV3Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  void user;
  const [filter, setFilter] = useState<V3Filter>('Aktiv');

  const filtered = useMemo(() => {
    return projects
      .filter(p => p.status === filter as ProjectStatus)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects, filter]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>

      {/* Header */}
      <div style={{
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        paddingBottom: 8, paddingLeft: 20, paddingRight: 20,
        display: 'grid', gridTemplateColumns: '36px 1fr 36px', alignItems: 'center', gap: 10,
      }}>
        <div />
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
          letterSpacing: -0.4, textAlign: 'center', color: 'var(--fg)',
        }}>
          {t('projects.title')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ProjectsMenu
            onSignOut={onSignOut}
            onToggleTheme={onToggleTheme}
            theme={theme}
            onExport={onExport}
            onPrivacy={onPrivacy}
            onFeedback={onFeedback}
            designVersion={designVersion}
            onToggleDesignVersion={onToggleDesignVersion}
          />
        </div>
      </div>

      {/* Status segmented control */}
      <div style={{ padding: '8px 20px 4px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 4,
        }}>
          {FILTERS.map(({ id, tKey, Icon }) => {
            const isActive = filter === id;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--primary-foreground)' : 'var(--fg)',
                  fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
                  transition: 'background 0.15s',
                }}
              >
                <Icon size={18} strokeWidth={2} />
                <span style={{ fontSize: 11, letterSpacing: -0.1 }}>{t(tKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Count subtitle */}
      <div style={{
        padding: '12px 22px 10px', fontSize: 13.5, color: 'var(--muted-fg)', fontWeight: 500,
      }}>
        {t(COUNT_KEY[filter], { count: filtered.length })}
      </div>

      {/* Grid */}
      <div style={{
        flex: 1, overflowY: 'auto', paddingBottom: 96,
        WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain',
      } as React.CSSProperties}>
        {filtered.length === 0 ? (
          <EmptyV3 onNew={onNewProject} filter={filter} />
        ) : (
          <div style={{
            padding: '0 20px', display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', gap: 14,
          }}>
            {filtered.map(p => (
              <ProjectCardV3 key={p.id} project={p} onOpen={() => onSelectProject(p.id)} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={onNewProject}
        aria-label={t('projects.newProject')}
        style={{
          position: 'absolute', right: 20, bottom: 80, zIndex: 25,
          width: 56, height: 56, borderRadius: 999, border: 'none',
          background: 'var(--primary)', color: 'var(--primary-foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 8px 24px -6px color-mix(in oklab, var(--primary) 45%, transparent), 0 2px 6px rgba(0,0,0,.1)',
        }}
      >
        <Plus size={26} strokeWidth={2.2} />
      </button>
    </div>
  );
}
