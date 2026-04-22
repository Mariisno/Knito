
const ProjectIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7l8-4 8 4-8 4-8-4z"/>
    <path d="M4 12l8 4 8-4"/>
    <path d="M4 17l8 4 8-4"/>
  </svg>
);

const YarnIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="8.5"/>
    <path d="M6 7c3 4 9 4 12 0M6 12c3 4 9 4 12 0M6 17c3 4 9 4 12 0"/>
  </svg>
);

const NeedleIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l6-6M8 16l8-8 5-5-1 5-8 8z"/>
    <circle cx="6.5" cy="17.5" r="1"/>
  </svg>
);

const StatsIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M4 19h16"/>
    <path d="M7 19V9M12 19V5M17 19v-7"/>
  </svg>
);

const TABS = [
  { id: 'prosjekter', label: 'Prosjekter', Icon: ProjectIcon },
  { id: 'garnlager',  label: 'Garn',       Icon: YarnIcon },
  { id: 'verktoy',   label: 'Pinner',      Icon: NeedleIcon },
  { id: 'statistikk', label: 'Statistikk', Icon: StatsIcon },
] as const;

export type TabId = typeof TABS[number]['id'];

interface BottomTabBarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        background: 'color-mix(in oklab, var(--bg) 86%, transparent)',
        backdropFilter: 'saturate(140%) blur(18px)',
        WebkitBackdropFilter: 'saturate(140%) blur(18px)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 12px 6px' }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                color: active ? 'var(--fg)' : 'var(--muted-fg)',
                padding: '6px 0',
                fontFamily: 'var(--font-ui)',
              }}
            >
              <Icon size={22} />
              <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500, letterSpacing: -0.1 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
