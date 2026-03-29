import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { SupabaseClient } from '@supabase/supabase-js';

interface PasswordResetFlowProps {
  supabase: SupabaseClient;
}

export function PasswordResetFlow({ supabase }: PasswordResetFlowProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery token
    const checkRecoveryToken = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && session.user) {
          setValidToken(true);
        } else {
          toast.error('Ugyldig eller utløpt tilbakestillingslenke', {
            description: 'Vennligst be om en ny lenke.',
            duration: 8000,
          });
        }
      } catch (error) {
        console.error('Error checking recovery token:', error);
        toast.error('Kunne ikke verifisere lenken');
      } finally {
        setCheckingToken(false);
      }
    };

    checkRecoveryToken();
  }, [supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Vennligst fyll inn begge feltene');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Passordet må være minst 6 tegn');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passordene stemmer ikke overens');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success('Passordet ditt er oppdatert!', {
        description: 'Du blir automatisk logget inn om 3 sekunder...',
        duration: 5000,
      });

      // Redirect to home after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error('Kunne ikke oppdatere passordet', {
        description: error.message || 'Prøv igjen eller be om ny lenke.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifiserer lenke...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-border">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl text-destructive">
              ⚠️ Ugyldig lenke
            </CardTitle>
            <CardDescription>
              Tilbakestillingslenken er ugyldig eller utløpt
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Lenker for passordtilbakestilling er gyldige i 1 time.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.href = '/'}>
                Tilbake til innlogging
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/#admin-reset'}>
                Bruk admin-verktøy i stedet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-border">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl text-primary">
            🔑 Tilbakestill passord
          </CardTitle>
          <CardDescription>
            Skriv inn ditt nye passord
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Passordet er oppdatert!</h3>
                <p className="text-sm text-muted-foreground">
                  Du blir automatisk logget inn om litt...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nytt passord</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minst 6 tegn"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bekreft passord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Skriv inn passordet igjen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oppdaterer...
                  </>
                ) : (
                  'Oppdater passord'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-primary hover:underline"
            >
              ← Tilbake til innlogging
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
