import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';
import { getSupabaseClient } from '../utils/supabase/client';

type TestStatus = 'idle' | 'running' | 'success' | 'error';

interface TestResult {
  name: string;
  status: TestStatus;
  message?: string;
  details?: any;
}

export function DiagnosticTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: '1. Supabase-konfigurasjon', status: 'idle' },
    { name: '2. Supabase-tilkobling', status: 'idle' },
    { name: '3. Edge Functions-tilkobling', status: 'idle' },
    { name: '4. Opprett testkonto', status: 'idle' },
    { name: '5. Logg inn med testkonto', status: 'idle' },
  ]);
  const [running, setRunning] = useState(false);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runDiagnostics = async () => {
    setRunning(true);
    const supabase = getSupabaseClient();
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'test123456';

    // Test 1: Check configuration
    updateTest(0, { status: 'running' });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!projectId || !publicAnonKey) {
      updateTest(0, { 
        status: 'error', 
        message: 'Mangler Supabase-konfigurasjon',
        details: { projectId: !!projectId, publicAnonKey: !!publicAnonKey }
      });
      setRunning(false);
      return;
    }
    updateTest(0, { 
      status: 'success', 
      message: 'Konfigurasjon funnet',
      details: { projectId, publicAnonKeyLength: publicAnonKey.length }
    });

    // Test 2: Test Supabase connection
    updateTest(1, { status: 'running' });
    try {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      updateTest(1, { status: 'success', message: 'Supabase er tilgjengelig' });
    } catch (error) {
      updateTest(1, { 
        status: 'error', 
        message: 'Kunne ikke koble til Supabase',
        details: error instanceof Error ? error.message : String(error)
      });
      setRunning(false);
      return;
    }

    // Test 3: Test Edge Functions
    updateTest(2, { status: 'running' });
    try {
      const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b06c9f7a`;
      const response = await fetch(`${API_BASE}/projects`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const responseText = await response.text();
      
      if (response.status === 401) {
        updateTest(2, { 
          status: 'success', 
          message: 'Edge Function fungerer (forventet 401 uten login)',
          details: { status: response.status }
        });
      } else if (response.ok) {
        updateTest(2, { 
          status: 'success', 
          message: 'Edge Function fungerer',
          details: { status: response.status }
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
    } catch (error) {
      updateTest(2, { 
        status: 'error', 
        message: 'Edge Functions er ikke tilgjengelig',
        details: error instanceof Error ? error.message : String(error)
      });
      setRunning(false);
      return;
    }

    // Test 4: Create test account via Edge Function
    updateTest(3, { status: 'running' });
    try {
      const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b06c9f7a`;
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Test User',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}`);
      }

      updateTest(3, { 
        status: 'success', 
        message: 'Testkonto opprettet via Edge Function',
        details: { email: testEmail }
      });
    } catch (error) {
      updateTest(3, { 
        status: 'error', 
        message: 'Kunne ikke opprette testkonto',
        details: error instanceof Error ? error.message : String(error)
      });
      setRunning(false);
      return;
    }

    // Test 5: Sign in with test account
    updateTest(4, { status: 'running' });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) throw error;

      if (!data.session?.access_token) {
        throw new Error('Ingen access token returnert');
      }

      updateTest(4, { 
        status: 'success', 
        message: 'Innlogging fungerer!',
        details: { 
          userId: data.user?.id,
          hasAccessToken: !!data.session?.access_token 
        }
      });

      // Clean up: sign out
      await supabase.auth.signOut();

    } catch (error) {
      updateTest(4, { 
        status: 'error', 
        message: 'Kunne ikke logge inn',
        details: error instanceof Error ? error.message : String(error)
      });
      setRunning(false);
      return;
    }

    setRunning(false);
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const allPassed = tests.every(t => t.status === 'success');
  const anyFailed = tests.some(t => t.status === 'error');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🔧 Diagnostikk for Strikke-app</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Denne testen verifiserer at alle systemkomponenter fungerer korrekt.
            </p>
            
            <Button 
              onClick={runDiagnostics} 
              disabled={running}
              className="w-full"
            >
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kjører tester...
                </>
              ) : (
                'Start diagnostikk'
              )}
            </Button>

            {allPassed && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  ✅ Alle tester bestått! Systemet fungerer som det skal.
                </p>
                <p className="text-green-700 dark:text-green-300 mt-2">
                  Hvis du fortsatt har problemer med å logge inn, prøv å refreshe siden eller sjekk at du bruker riktig e-post og passord.
                </p>
              </div>
            )}

            {anyFailed && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  ❌ Noen tester feilet. Se detaljer nedenfor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {tests.map((test, index) => (
            <Card key={index} className={
              test.status === 'success' ? 'border-green-200 dark:border-green-800' :
              test.status === 'error' ? 'border-red-200 dark:border-red-800' :
              test.status === 'running' ? 'border-blue-200 dark:border-blue-800' :
              ''
            }>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{test.name}</p>
                    {test.message && (
                      <p className="text-muted-foreground mt-1">{test.message}</p>
                    )}
                    {test.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Vis detaljer
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📝 Feilsøkingsinstruksjoner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Hvis Edge Functions feiler:</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Sjekk at Edge Function er deployet i Supabase Dashboard</li>
                <li>Gå til: Supabase Dashboard → Edge Functions</li>
                <li>Deploy funksjonen 'server' hvis den ikke er deployet</li>
                <li>Sjekk logs for eventuelle feilmeldinger</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium mb-2">Hvis testkonto-opprettelse feiler:</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Sjekk at SUPABASE_SERVICE_ROLE_KEY er satt som secret</li>
                <li>Verifiser at Edge Function har riktige miljøvariabler</li>
                <li>Sjekk Edge Function logs i Supabase Dashboard</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium mb-2">Hvis innlogging feiler:</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Sjekk at du bruker riktig e-post og passord</li>
                <li>Passordet må være minst 6 tegn</li>
                <li>Sjekk at bruker er opprettet i Supabase Auth</li>
                <li>Prøv å refreshe siden</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}