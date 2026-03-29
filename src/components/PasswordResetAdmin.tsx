import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

export function PasswordResetAdmin() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !newPassword.trim()) {
      toast.error('Vennligst fyll inn både e-post og nytt passord');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Passordet må være minst 6 tegn');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b06c9f7a`;
      const response = await fetch(`${API_BASE}/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke tilbakestille passord');
      }

      setSuccess(true);
      toast.success('Passordet er tilbakestilt!', {
        description: `Du kan nå logge inn med: ${email}`,
        duration: 8000,
      });
      
      // Clear form
      setEmail('');
      setNewPassword('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.message.includes('User not found')) {
        toast.error('Ingen bruker funnet med denne e-postadressen');
      } else {
        toast.error(error.message || 'Kunne ikke tilbakestille passord');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-border">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl text-primary">
            🔑 Admin: Tilbakestill Passord
          </CardTitle>
          <CardDescription>
            Tilbakestill passordet for en bruker direkte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-medium mb-1">Utviklingsverktøy</p>
                <p className="text-xs">
                  Dette er et midlertidig verktøy for å tilbakestille passord når e-postserveren ikke er konfigurert.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-postadresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@epost.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nytt passord</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minst 6 tegn"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                  Tilbakestiller...
                </>
              ) : (
                'Tilbakestill passord'
              )}
            </Button>
          </form>

          {success && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="text-sm text-green-900 dark:text-green-100">
                  <p className="font-medium">Passordet er oppdatert!</p>
                  <p className="text-xs mt-1">Du kan nå gå tilbake og logge inn med det nye passordet.</p>
                </div>
              </div>
            </div>
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
