import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, Bug, Lightbulb, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useReports } from '../hooks/useReports';
import { useTranslation } from '../contexts/LanguageContext';
import type { PublicReport, ReportStatus, ReportType } from '../types/feedback';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string | null;
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  'open': 'Åpen',
  'in-progress': 'Påbegynt',
  'resolved': 'Løst',
  'wontfix': 'Avvist',
};

const STATUS_COLORS: Record<ReportStatus, { bg: string; fg: string }> = {
  'open':        { bg: 'color-mix(in oklab, var(--primary) 14%, transparent)', fg: 'var(--primary)' },
  'in-progress': { bg: 'color-mix(in oklab, #c9856b 18%, transparent)',        fg: '#c9856b' },
  'resolved':    { bg: 'color-mix(in oklab, #7a8a6a 22%, transparent)',        fg: '#7a8a6a' },
  'wontfix':     { bg: 'color-mix(in oklab, var(--muted-fg) 18%, transparent)', fg: 'var(--muted-fg)' },
};

const TYPE_LABEL: Record<ReportType, string> = {
  bug: 'Feil',
  feature: 'Forslag',
};

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 2000;

type Tab = 'submit' | 'list';
type TypeFilter = 'all' | ReportType;
type StatusFilter = 'active' | 'resolved';

export function FeedbackDialog({ open, onOpenChange, accessToken }: Props) {
  const { reports, loading, submitReport, toggleVote } = useReports(accessToken, open);

  const [tab, setTab] = useState<Tab>('submit');
  const [type, setType] = useState<ReportType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  useEffect(() => {
    if (open) {
      setTab('submit');
      setType('bug');
      setTitle('');
      setDescription('');
      setSubmitting(false);
      setTypeFilter('all');
      setStatusFilter('active');
    }
  }, [open]);

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const canSubmit =
    trimmedTitle.length >= 3 &&
    trimmedTitle.length <= MAX_TITLE &&
    trimmedDescription.length >= 3 &&
    trimmedDescription.length <= MAX_DESCRIPTION &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const ok = await submitReport({ type, title: trimmedTitle, description: trimmedDescription });
    setSubmitting(false);
    if (ok) {
      setTitle('');
      setDescription('');
      setType('bug');
      setTab('list');
      setStatusFilter('active');
    }
  };

  const filtered = useMemo(() => {
    const isActive = (s: ReportStatus) => s === 'open' || s === 'in-progress';
    return reports
      .filter(r => typeFilter === 'all' ? true : r.type === typeFilter)
      .filter(r => statusFilter === 'active' ? isActive(r.status) : !isActive(r.status))
      .sort((a, b) => {
        if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [reports, typeFilter, statusFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: 460, maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
        <DialogHeader style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, marginBottom: 0 }}>
          <DialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, letterSpacing: -0.5 }}>
            Tilbakemelding
          </DialogTitle>
          <p style={{ fontSize: 13, color: 'var(--muted-fg)', marginTop: 2 }}>
            Meld inn feil eller foreslå forbedringer
          </p>

          <div style={{ display: 'flex', gap: 6, marginTop: 14, background: 'var(--accent)', padding: 4, borderRadius: 10 }}>
            <TabButton active={tab === 'submit'} onClick={() => setTab('submit')}>Send inn</TabButton>
            <TabButton active={tab === 'list'} onClick={() => setTab('list')}>
              Innmeldt
              {reports.length > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 11, padding: '0 6px', borderRadius: 999,
                  background: tab === 'list' ? 'var(--primary)' : 'var(--muted-fg)',
                  color: 'var(--primary-foreground)',
                  fontWeight: 700,
                }}>
                  {reports.length}
                </span>
              )}
            </TabButton>
          </div>
        </DialogHeader>

        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
          {tab === 'submit' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <Label>Type</Label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <TypeChoice
                    active={type === 'bug'}
                    icon={<Bug size={16} />}
                    label="Feil"
                    onClick={() => setType('bug')}
                  />
                  <TypeChoice
                    active={type === 'feature'}
                    icon={<Lightbulb size={16} />}
                    label="Forslag"
                    onClick={() => setType('feature')}
                  />
                </div>
              </div>

              <div>
                <Label>Tittel</Label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value.slice(0, MAX_TITLE))}
                  placeholder={type === 'bug' ? 'Kort beskrivelse av feilen' : 'Kort beskrivelse av forslaget'}
                  style={inputStyle}
                />
                <Counter value={title.length} max={MAX_TITLE} />
              </div>

              <div>
                <Label>Beskrivelse</Label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
                  placeholder={type === 'bug'
                    ? 'Hva skjedde? Hva forventet du? Hvilken enhet/nettleser?'
                    : 'Hva ønsker du å kunne gjøre? Hvorfor er det nyttig?'
                  }
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 110, fontFamily: 'var(--font-ui)' }}
                />
                <Counter value={description.length} max={MAX_DESCRIPTION} />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  marginTop: 4,
                  padding: '11px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: canSubmit ? 'var(--primary)' : 'var(--muted)',
                  color: canSubmit ? 'var(--primary-foreground)' : 'var(--muted-fg)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-ui)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Send inn
              </button>

              <p style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 2 }}>
                Innmeldinger er synlige for alle brukere, men uten navn.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>Alle</FilterChip>
                <FilterChip active={typeFilter === 'bug'} onClick={() => setTypeFilter('bug')}>Feil</FilterChip>
                <FilterChip active={typeFilter === 'feature'} onClick={() => setTypeFilter('feature')}>Forslag</FilterChip>
                <span style={{ width: 1, background: 'var(--border)', margin: '2px 4px' }} />
                <FilterChip active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>Aktive</FilterChip>
                <FilterChip active={statusFilter === 'resolved'} onClick={() => setStatusFilter('resolved')}>Løste</FilterChip>
              </div>

              {loading && reports.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--muted-fg)' }} />
                </div>
              ) : filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted-fg)', fontSize: 13, padding: '24px 0' }}>
                  {reports.length === 0
                    ? 'Ingen innmeldte saker ennå – vær den første!'
                    : 'Ingen saker matcher filteret.'}
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filtered.map(r => <ReportRow key={r.id} report={r} onVote={() => toggleVote(r.id)} />)}
                </ul>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '7px 10px',
        borderRadius: 7,
        border: 'none',
        background: active ? 'var(--bg)' : 'transparent',
        color: active ? 'var(--fg)' : 'var(--muted-fg)',
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)',
        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function TypeChoice({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '10px 12px',
        borderRadius: 10,
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        background: active ? 'color-mix(in oklab, var(--primary) 12%, transparent)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--fg)',
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 11px',
        borderRadius: 999,
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        background: active ? 'color-mix(in oklab, var(--primary) 14%, transparent)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--muted-fg)',
        fontWeight: active ? 600 : 500,
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label style={{
      display: 'block',
      fontSize: 11,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: 'var(--muted-fg)',
      fontWeight: 500,
      marginBottom: 4,
    }}>
      {children}
    </label>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  const near = value / max > 0.9;
  return (
    <div style={{
      fontSize: 11,
      color: near ? 'var(--primary)' : 'var(--muted-fg)',
      textAlign: 'right',
      marginTop: 2,
    }}>
      {value} / {max}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--fg)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'var(--font-ui)',
  boxSizing: 'border-box',
};

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'akkurat nå';
  if (minutes < 60) return `${minutes} min siden`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} t siden`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d siden`;
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ReportRow({ report, onVote }: { report: PublicReport; onVote: () => void }) {
  const status = STATUS_COLORS[report.status];
  const TypeIcon = report.type === 'bug' ? Bug : Lightbulb;

  return (
    <li style={{
      display: 'flex', gap: 12,
      padding: 12,
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
    }}>
      <button
        type="button"
        onClick={onVote}
        aria-label={report.hasVoted ? 'Fjern stemme' : 'Stem opp'}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
          width: 44, padding: '6px 0',
          borderRadius: 10,
          border: `1px solid ${report.hasVoted ? 'var(--primary)' : 'var(--border)'}`,
          background: report.hasVoted ? 'color-mix(in oklab, var(--primary) 14%, transparent)' : 'transparent',
          color: report.hasVoted ? 'var(--primary)' : 'var(--fg)',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          flexShrink: 0,
        }}
      >
        <ArrowUp size={16} strokeWidth={report.hasVoted ? 2.4 : 1.8} />
        <span style={{ fontSize: 13, fontWeight: report.hasVoted ? 700 : 500 }}>{report.upvotes}</span>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '1px 7px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            background: report.type === 'bug'
              ? 'color-mix(in oklab, #c9856b 18%, transparent)'
              : 'color-mix(in oklab, #7a8a6a 20%, transparent)',
            color: report.type === 'bug' ? '#c9856b' : '#7a8a6a',
          }}>
            <TypeIcon size={11} />
            {TYPE_LABEL[report.type]}
          </span>
          <span style={{
            padding: '1px 7px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            background: status.bg,
            color: status.fg,
          }}>
            {STATUS_LABEL[report.status]}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted-fg)', marginLeft: 'auto' }}>
            {formatRelative(report.createdAt)}
          </span>
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)', marginBottom: 2, lineHeight: 1.3 }}>
          {report.title}
        </div>
        <div style={{
          fontSize: 13, color: 'var(--muted-fg)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {report.description}
        </div>
      </div>
    </li>
  );
}
