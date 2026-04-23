import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { TermsDialog } from './TermsDialog';

// KnitoMark — small square logo
function KnitoMark({ s = 32 }: { s?: number }) {
  return (
    <div style={{
      width: s, height: s, borderRadius: 8,
      background: 'var(--primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--primary-foreground)', flexShrink: 0,
    }}>
      <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M5 4c-.8 3-.8 5 0 8s.8 5 0 8M12 4c-.8 3-.8 5 0 8s.8 5 0 8M19 4c-.8 3-.8 5 0 8s.8 5 0 8"/>
      </svg>
    </div>
  );
}

// Floating-label field
function Field({
  label, type = 'text', value, onChange, placeholder, autoComplete, disabled,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; disabled?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 14, top: 10,
        fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase',
        color: 'var(--muted-fg)', fontWeight: 500,
      }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        style={{
          width: '100%', height: 64, padding: '26px 14px 8px',
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
          fontSize: 15, color: 'var(--fg)', fontFamily: 'var(--font-ui)',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

interface AuthFormProps {
  onSignIn?: (email: string, password: string) => Promise<void>;
  onSignUp?: (email: string, password: string, name: string) => Promise<void>;
  supabase?: SupabaseClient;
}

export function AuthForm({ onSignIn: _onSignIn, onSignUp: _onSignUp, supabase: supabaseProp }: AuthFormProps) {
  const auth = useAuth();
  const onSignIn = _onSignIn ?? auth.signIn;
  const onSignUp = _onSignUp ?? auth.signUp;
  const supabase = supabaseProp ?? auth.supabase;

  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) { toast.error('Vennligst skriv inn navn'); return; }
        if (!termsAccepted) { toast.error('Du må godta brukervilkårene for å opprette konto'); return; }
        await onSignUp(email, password, name);
        toast.success('Konto opprettet! Du er nå logget inn.');
      } else {
        await onSignIn(email, password);
        toast.success('Velkommen tilbake!');
      }
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Feil e-post eller passord');
      } else if (error.message?.includes('User already registered')) {
        toast.error('En bruker med denne e-posten eksisterer allerede');
      } else {
        toast.error(isSignUp ? 'Kunne ikke opprette konto' : 'Kunne ikke logge inn');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = resetEmail.trim().toLowerCase();
    if (!normalizedEmail) { toast.error('Vennligst skriv inn e-postadressen din'); return; }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });
      if (error) throw error;
      toast.success('Sjekk e-posten din for å tilbakestille passordet!', { description: 'Lenken er gyldig i 1 time.', duration: 10000 });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      if (error.message?.includes('Email not confirmed')) {
        toast.error('E-postadressen er ikke bekreftet.');
      } else if (error.message?.includes('not found')) {
        toast.error('Ingen bruker med denne e-postadressen.');
      } else {
        toast.error('Kunne ikke sende tilbakestillingslenke.', { description: 'Sjekk at e-postserveren er konfigurert i Supabase.', duration: 8000 });
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-ui)', color: 'var(--fg)',
      }}>
        {/* Top section */}
        <div style={{ padding: '50px 30px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <KnitoMark s={32} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, letterSpacing: -0.3 }}>
              Knito
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 8 }}>
            {isSignUp ? 'Opprett konto' : 'Velkommen tilbake'}
          </div>
          <div style={{ fontSize: 14.5, color: 'var(--muted-fg)', lineHeight: 1.5 }}>
            {isSignUp ? 'Lag en konto for å lagre prosjektene dine' : 'Logg inn for å åpne prosjektene dine'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isSignUp && (
            <Field label="Navn" value={name} onChange={setName} placeholder="Ola Nordmann" autoComplete="name" disabled={loading} />
          )}
          <Field label="E-post" type="email" value={email} onChange={setEmail} placeholder="din@epost.no" autoComplete="username" disabled={loading} />
          <Field label="Passord" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete={isSignUp ? 'new-password' : 'current-password'} disabled={loading} />

          {!isSignUp && (
            <div style={{ textAlign: 'right', margin: '-4px 2px 4px' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{ fontSize: 12.5, color: 'var(--muted-fg)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
              >
                Glemt passord?
              </button>
            </div>
          )}

          {isSignUp && (
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '4px 2px', cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                disabled={loading}
                style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: 13, color: 'var(--muted-fg)', lineHeight: 1.45 }}>
                Jeg godtar{' '}
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setShowTerms(true); }}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: 'var(--fg)', fontWeight: 600, fontSize: 13,
                    fontFamily: 'var(--font-ui)', textDecoration: 'underline',
                  }}
                >
                  brukervilkårene
                </button>
                {' '}og personvernerklæringen
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || (isSignUp && !termsAccepted)}
            style={{
              height: 52, borderRadius: 14, border: 'none',
              background: 'var(--fg)', color: 'var(--bg)',
              cursor: (loading || (isSignUp && !termsAccepted)) ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (loading || (isSignUp && !termsAccepted)) ? 0.5 : 1,
            }}
          >
            {loading && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} className="animate-spin" />}
            {isSignUp ? 'Opprett konto' : 'Logg inn'}
          </button>
        </form>

        <div style={{ flex: 1 }} />

        {/* Bottom links */}
        <div style={{ padding: '20px 30px 40px', textAlign: 'center', fontSize: 13, color: 'var(--muted-fg)' }}>
          {isSignUp ? 'Har du allerede en konto? ' : 'Ingen konto? '}
          <button
            type="button"
            onClick={() => { setIsSignUp(v => !v); setTermsAccepted(false); }}
            style={{ color: 'var(--fg)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13 }}
          >
            {isSignUp ? 'Logg inn' : 'Opprett en'}
          </button>
        </div>
      </div>

      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Tilbakestill passord</DialogTitle>
            <DialogDescription>
              Skriv inn e-postadressen din, så sender vi deg en lenke for å tilbakestille passordet.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-post</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="din@epost.no"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={resetLoading}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} disabled={resetLoading}>
                Avbryt
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sender...</> : 'Send tilbakestillingslenke'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
