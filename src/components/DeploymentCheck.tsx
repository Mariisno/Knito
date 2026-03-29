import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, XCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

type CheckStatus = 'idle' | 'checking' | 'success' | 'warning' | 'error';

interface Check {
  name: string;
  status: CheckStatus;
  message?: string;
  action?: string;
  actionUrl?: string;
}

export function DeploymentCheck() {
  const [checks, setChecks] = useState<Check[]>([
    { name: 'Environment Variables', status: 'idle' },
    { name: 'Supabase Connection', status: 'idle' },
    { name: 'Edge Functions', status: 'idle' },
    { name: 'Domain Configuration', status: 'idle' },
  ]);
  const [checking, setChecking] = useState(false);

  const updateCheck = (index: number, updates: Partial<Check>) => {
    setChecks(prev => prev.map((check, i) => i === index ? { ...check, ...updates } : check));
  };

  const runChecks = async () => {
    setChecking(true);

    // Check 1: Environment Variables
    updateCheck(0, { status: 'checking' });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const isProduction = window.location.hostname === 'knito.vercel.app';
    
    if (!projectId || !publicAnonKey) {
      updateCheck(0, { 
        status: 'error', 
        message: 'Environment variables mangler',
        action: 'Legg til VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY i Vercel',
        actionUrl: 'https://vercel.com/docs/concepts/projects/environment-variables'
      });
      setChecking(false);
      return;
    } else {
      updateCheck(0, { 
        status: 'success', 
        message: 'Environment variables er konfigurert',
      });
    }

    // Check 2: Supabase Connection
    updateCheck(1, { status: 'checking' });
    try {
      const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
        headers: {
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok || response.status === 404) {
        updateCheck(1, { 
          status: 'success', 
          message: 'Supabase er tilgjengelig',
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      updateCheck(1, { 
        status: 'error', 
        message: 'Kan ikke koble til Supabase',
        action: 'Sjekk Supabase project status',
        actionUrl: `https://app.supabase.com/project/${projectId}`
      });
      setChecking(false);
      return;
    }

    // Check 3: Edge Functions
    updateCheck(2, { status: 'checking' });
    try {
      const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b06c9f7a`;
      const response = await fetch(`${API_BASE}/projects`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.status === 401 || response.ok) {
        updateCheck(2, { 
          status: 'success', 
          message: 'Edge Functions fungerer',
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      updateCheck(2, { 
        status: 'error', 
        message: 'Edge Functions er ikke tilgjengelig',
        action: 'Deploy Edge Function i Supabase',
        actionUrl: `https://app.supabase.com/project/${projectId}/functions`
      });
      setChecking(false);
      return;
    }

    // Check 4: Domain Configuration
    updateCheck(3, { status: 'checking' });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (isProduction) {
      updateCheck(3, { 
        status: 'warning', 
        message: 'Husk å legge til https://knito.vercel.app/** i Supabase Auth Redirect URLs',
        action: 'Konfigurer Redirect URLs',
        actionUrl: `https://app.supabase.com/project/${projectId}/auth/url-configuration`
      });
    } else {
      updateCheck(3, { 
        status: 'success', 
        message: 'Lokal utvikling - ingen config nødvendig',
      });
    }

    setChecking(false);
  };

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const allPassed = checks.every(c => c.status === 'success' || c.status === 'warning');
  const anyFailed = checks.some(c => c.status === 'error');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🚀 Deployment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm mb-2">
                <strong>Deployed to:</strong> <a href="https://knito.vercel.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://knito.vercel.app</a>
              </p>
              <p className="text-sm">
                <strong>Current URL:</strong> {window.location.href}
              </p>
            </div>
            
            <Button 
              onClick={runChecks} 
              disabled={checking}
              className="w-full"
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sjekker deployment...
                </>
              ) : (
                'Sjekk deployment status'
              )}
            </Button>

            {allPassed && !checking && checks.some(c => c.status !== 'idle') && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  ✅ Deployment ser bra ut!
                </p>
              </div>
            )}

            {anyFailed && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  ❌ Noen sjekker feilet. Se detaljer nedenfor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {checks.map((check, index) => (
            <Card key={index} className={
              check.status === 'success' ? 'border-green-200 dark:border-green-800' :
              check.status === 'warning' ? 'border-yellow-200 dark:border-yellow-800' :
              check.status === 'error' ? 'border-red-200 dark:border-red-800' :
              check.status === 'checking' ? 'border-blue-200 dark:border-blue-800' :
              ''
            }>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(check.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{check.name}</p>
                    {check.message && (
                      <p className="text-muted-foreground mt-1 text-sm">{check.message}</p>
                    )}
                    {check.action && check.actionUrl && (
                      <a 
                        href={check.actionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                      >
                        {check.action}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📋 Quick Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Vercel Environment Variables</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Gå til Vercel Dashboard → Settings → Environment Variables
              </p>
              <div className="p-3 bg-muted rounded text-xs font-mono">
                VITE_SUPABASE_URL = your-project-url<br/>
                VITE_SUPABASE_ANON_KEY = your-anon-key
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. Supabase Auth Redirect URLs</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Gå til Supabase Dashboard → Authentication → URL Configuration
              </p>
              <div className="p-3 bg-muted rounded text-xs font-mono">
                https://knito.vercel.app/**<br/>
                https://knito.vercel.app/reset-password
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">3. Deploy Edge Functions</h3>
              <p className="text-sm text-muted-foreground">
                Sjekk at 'server' Edge Function er deployet i Supabase Dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
