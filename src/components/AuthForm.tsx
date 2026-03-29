import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getSupabaseClient } from '../utils/supabase/client';

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
}

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const supabase = getSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          toast.error('Vennligst skriv inn navn');
          return;
        }
        await onSignUp(email, password, name);
        toast.success('Konto opprettet! Du er nå logget inn.');
      } else {
        await onSignIn(email, password);
        toast.success('Velkommen tilbake!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
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
    
    if (!resetEmail.trim()) {
      toast.error('Vennligst skriv inn e-postadressen din');
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Sjekk e-posten din for å tilbakestille passordet!');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error('Kunne ikke sende tilbakestillingslenke. Prøv igjen.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setEmail('test@example.com');
    setPassword('test123456');
    toast.info('Testdata fylt inn. Klikk "Logg inn" for å fortsette.');
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-border">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-3xl text-primary">
              🧶 Strikkeprosjekter
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Opprett en konto for å lagre dine strikkeprosjekter'
                : 'Logg inn for å se dine strikkeprosjekter'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Navn</Label>
                  <Input
                    id="name"
                    placeholder="Ola Nordmann"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@epost.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Passord</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                      disabled={loading}
                    >
                      Glemt passord?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    {isSignUp ? 'Oppretter konto...' : 'Logger inn...'}
                  </>
                ) : (
                  isSignUp ? 'Opprett konto' : 'Logg inn'
                )}
              </Button>

              <div className="space-y-2">
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    disabled={loading}
                  >
                    {isSignUp 
                      ? 'Har du allerede en konto? Logg inn' 
                      : 'Har du ikke konto? Opprett en'
                    }
                  </button>
                </div>

                {/* Test login button */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleTestLogin}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    disabled={loading}
                  >
                    Fyll inn testdata
                  </button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForgotPassword(false)}
                disabled={resetLoading}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sender...
                  </>
                ) : (
                  'Send tilbakestillingslenke'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
