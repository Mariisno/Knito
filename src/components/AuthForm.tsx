import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
}

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (isSignUp && !name)) {
      toast.error('Vennligst fyll ut alle feltene');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Vennligst skriv inn en gyldig e-postadresse');
      return;
    }

    // Validate password length for signup
    if (isSignUp && password.length < 6) {
      toast.error('Passordet må være minst 6 tegn langt');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await onSignUp(email, password, name);
        toast.success('Konto opprettet! Logger inn...');
      } else {
        await onSignIn(email, password);
        toast.success('Velkommen tilbake!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Noe gikk galt';
      
      // Better error messages
      if (errorMessage.includes('already been registered')) {
        toast.error('Denne e-posten er allerede registrert. Prøv å logge inn i stedet.');
        setIsSignUp(false);
      } else if (errorMessage.includes('Invalid login credentials')) {
        toast.error('Feil e-post eller passord');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-4">
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
              <Label htmlFor="password">Passord</Label>
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-muted-foreground hover:text-primary transition-colors"
                disabled={loading}
              >
                {isSignUp 
                  ? 'Har du allerede en konto? Logg inn' 
                  : 'Har du ikke konto? Opprett en'
                }
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
