import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
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
  const { t } = useTranslation();
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
        if (!name.trim()) { toast.error(t('toasts.enterName')); return; }
        if (!termsAccepted) { toast.error(t('toasts.mustAcceptTerms')); return; }
        await onSignUp(email, password, name);
        toast.success(t('toasts.accountCreated'));
      } else {
        await onSignIn(email, password);
        toast.success(t('toasts.welcomeBack'));
      }
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error(t('toasts.invalidCredentials'));
      } else if (error.message?.includes('User already registered')) {
        toast.error(t('toasts.userExists'));
      } else {
        toast.error(isSignUp ? t('toasts.couldNotCreateAccount') : t('toasts.couldNotSignIn'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = resetEmail.trim().toLowerCase();
    if (!normalizedEmail) { toast.error(t('toasts.enterEmail')); return; }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });
      if (error) throw error;
      toast.success(t('toasts.resetSent'), { description: t('toasts.resetSentDescription'), duration: 10000 });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      if (error.message?.includes('Email not confirmed')) {
        toast.error(t('toasts.emailNotConfirmed'));
      } else if (error.message?.includes('not found')) {
        toast.error(t('toasts.userNotFound'));
      } else {
        toast.error(t('toasts.couldNotSendReset'), { description: t('toasts.couldNotSendResetDesc'), duration: 8000 });
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
        <div style={{ padding: 'clamp(32px, 12vw, 50px) clamp(20px, 6vw, 30px) 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <KnitoMark s={32} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, letterSpacing: -0.3 }}>
              Knito
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 8 }}>
            {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
          </div>
          <div style={{ fontSize: 14.5, color: 'var(--muted-fg)', lineHeight: 1.5 }}>
            {isSignUp ? t('auth.signUpSubtitle') : t('auth.signInSubtitle')}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 clamp(20px, 6vw, 30px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isSignUp && (
            <Field label={t('auth.name')} value={name} onChange={setName} placeholder={t('auth.namePlaceholder')} autoComplete="name" disabled={loading} />
          )}
          <Field label={t('auth.email')} type="email" value={email} onChange={setEmail} placeholder={t('auth.emailPlaceholder')} autoComplete="username" disabled={loading} />
          <Field label={t('auth.password')} type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete={isSignUp ? 'new-password' : 'current-password'} disabled={loading} />

          {!isSignUp && (
            <div style={{ textAlign: 'right', margin: '-4px 2px 4px' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{ fontSize: 12.5, color: 'var(--muted-fg)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
              >
                {t('auth.forgotPassword')}
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
                {t('auth.acceptTermsPrefix')}{' '}
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setShowTerms(true); }}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: 'var(--fg)', fontWeight: 600, fontSize: 13,
                    fontFamily: 'var(--font-ui)', textDecoration: 'underline',
                  }}
                >
                  {t('auth.acceptTermsLink')}
                </button>
                {' '}{t('auth.acceptTermsSuffix')}
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
            {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
          </button>
        </form>

        <div style={{ flex: 1 }} />

        {/* Bottom links */}
        <div style={{ padding: '20px clamp(20px, 6vw, 30px) 40px', textAlign: 'center', fontSize: 13, color: 'var(--muted-fg)' }}>
          {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
          <button
            type="button"
            onClick={() => { setIsSignUp(v => !v); setTermsAccepted(false); }}
            style={{ color: 'var(--fg)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13 }}
          >
            {isSignUp ? t('auth.signIn') : t('auth.createOne')}
          </button>
        </div>
      </div>

      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{t('auth.forgotPasswordTitle')}</DialogTitle>
            <DialogDescription>
              {t('auth.forgotPasswordDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t('auth.email')}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={resetLoading}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} disabled={resetLoading}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.sending')}</> : t('auth.sendResetLink')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
