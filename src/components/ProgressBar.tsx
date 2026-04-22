
interface ProgressBarProps {
  value: number;
  height?: number;
  color?: string;
  track?: string;
}

export function ProgressBar({
  value,
  height = 5,
  color = 'var(--primary)',
  track = 'var(--border)',
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ height, background: track, borderRadius: height, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height, transition: 'width .5s' }} />
    </div>
  );
}
