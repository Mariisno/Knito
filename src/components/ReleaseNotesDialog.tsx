import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CHANGELOG, LATEST_VERSION } from '../data/changelog';

const STORAGE_KEY = 'knito_last_seen_version';

export function getLastSeenVersion(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export function markVersionAsSeen() {
  localStorage.setItem(STORAGE_KEY, LATEST_VERSION);
}

export function hasUnseenRelease(): boolean {
  return getLastSeenVersion() !== LATEST_VERSION;
}

const TYPE_LABEL: Record<string, string> = {
  ny: 'Nytt',
  forbedring: 'Forbedring',
  fiks: 'Fiks',
};

const TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  ny:          { bg: '#e8f5e9', fg: '#2e7d32' },
  forbedring:  { bg: '#fff3e0', fg: '#e65100' },
  fiks:        { bg: '#fce4ec', fg: '#c62828' },
};

const TYPE_COLOR_DARK: Record<string, { bg: string; fg: string }> = {
  ny:          { bg: '#1b3a1e', fg: '#81c784' },
  forbedring:  { bg: '#3e2600', fg: '#ffb74d' },
  fiks:        { bg: '#3b0f19', fg: '#ef9a9a' },
};

function useDark() {
  return document.documentElement.classList.contains('dark');
}

function TypeBadge({ type }: { type: string }) {
  const dark = useDark();
  const colors = (dark ? TYPE_COLOR_DARK : TYPE_COLOR)[type] ?? { bg: 'var(--accent)', fg: 'var(--fg)' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 7px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.2,
      background: colors.bg,
      color: colors.fg,
      flexShrink: 0,
    }}>
      {TYPE_LABEL[type] ?? type}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReleaseNotesDialog({ open, onOpenChange }: Props) {
  const handleOpenChange = (val: boolean) => {
    if (!val) markVersionAsSeen();
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent style={{ maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
        <DialogHeader style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <DialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, letterSpacing: -0.5 }}>
            Hva er nytt?
          </DialogTitle>
          <p style={{ fontSize: 13, color: 'var(--muted-fg)', marginTop: 2 }}>
            Oppdateringer og forbedringer i Knito
          </p>
        </DialogHeader>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px 20px' }}>
          {CHANGELOG.map((release, i) => (
            <div key={release.version} style={{ paddingTop: 20, paddingBottom: i < CHANGELOG.length - 1 ? 20 : 0, borderBottom: i < CHANGELOG.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--fg)' }}>
                  v{release.version}
                </span>
                {i === 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                    padding: '1px 6px', borderRadius: 999,
                    background: 'var(--primary)', color: 'var(--primary-foreground)',
                  }}>
                    SISTE
                  </span>
                )}
                <span style={{ fontSize: 12, color: 'var(--muted-fg)', marginLeft: 'auto' }}>
                  {formatDate(release.date)}
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {release.changes.map((c, j) => (
                  <li key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <TypeBadge type={c.type} />
                    <span style={{ fontSize: 13.5, color: 'var(--fg)', lineHeight: 1.5 }}>{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
