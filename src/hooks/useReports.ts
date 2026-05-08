import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import * as api from '../utils/api';
import type { PublicReport, ReportType } from '../types/feedback';

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return 'Ukjent feil';
}

export function useReports(accessToken: string | null, enabled: boolean) {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await api.getReports(accessToken);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error(`Kunne ikke laste innmeldinger: ${errorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (enabled && accessToken) {
      load();
    }
  }, [enabled, accessToken, load]);

  const submitReport = async (input: { type: ReportType; title: string; description: string }) => {
    if (!accessToken) {
      toast.error('Du må være logget inn for å sende inn');
      return false;
    }

    try {
      const saved = await api.createReport(input, accessToken);
      setReports(prev => [saved, ...prev]);
      toast.success('Takk! Innmeldingen er sendt.');
      return true;
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error(`Kunne ikke sende inn: ${errorMessage(error)}`);
      return false;
    }
  };

  const toggleVote = async (id: string) => {
    if (!accessToken) return;

    const previous = reports;
    setReports(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next = !r.hasVoted;
      return {
        ...r,
        hasVoted: next,
        upvotes: Math.max(0, r.upvotes + (next ? 1 : -1)),
      };
    }));

    try {
      const updated = await api.toggleReportVote(id, accessToken);
      setReports(prev => prev.map(r => r.id === id ? updated : r));
    } catch (error) {
      console.error('Failed to toggle vote:', error);
      setReports(previous);
      toast.error(`Kunne ikke registrere stemme: ${errorMessage(error)}`);
    }
  };

  return { reports, loading, submitReport, toggleVote, reload: load };
}
