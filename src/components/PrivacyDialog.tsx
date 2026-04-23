import { useState } from 'react';
import { Loader2, Download, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';
import { TermsDialog } from './TermsDialog';
import { exportAllDataAsJSON } from '../utils/export';
import { deleteAccount } from '../utils/api';
import type { KnittingProject, Yarn, NeedleInventoryItem } from '../types/knitting';

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: KnittingProject[];
  standaloneYarns: Yarn[];
  needleInventory: NeedleInventoryItem[];
  accessToken: string;
  onAccountDeleted: () => void;
}

export function PrivacyDialog({
  open, onOpenChange, projects, standaloneYarns, needleInventory, accessToken, onAccountDeleted,
}: PrivacyDialogProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = () => {
    exportAllDataAsJSON(projects, standaloneYarns, needleInventory);
    toast.success('Dine data er lastet ned');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(accessToken);
      toast.success('Kontoen din er slettet');
      onAccountDeleted();
    } catch {
      toast.error('Kunne ikke slette konto. Prøv igjen.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card" style={{ maxWidth: 440 }}>
          <DialogHeader>
            <DialogTitle>Personvern og vilkår</DialogTitle>
            <DialogDescription>
              Administrer dine data og se hva Knito lagrer om deg.
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>

            <div style={{
              background: 'var(--muted)', borderRadius: 10,
              padding: '12px 14px', fontSize: 13, color: 'var(--muted-fg)', lineHeight: 1.5,
            }}>
              Knito lagrer prosjektene dine, garnoversikt, nålerinventar og bilder/PDF-er.
              Alle data tilhører deg og deles aldri med andre.
            </div>

            <button
              onClick={handleExport}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 10,
                background: 'var(--card)', border: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                fontFamily: 'var(--font-ui)',
              }}
            >
              <Download style={{ width: 18, height: 18, color: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>Last ned mine data</div>
                <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 2 }}>
                  JSON-fil med alle prosjekter, garn og pinner
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowTerms(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 10,
                background: 'var(--card)', border: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                fontFamily: 'var(--font-ui)',
              }}
            >
              <FileText style={{ width: 18, height: 18, color: 'var(--muted-fg)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>Brukervilkår og personvernerklæring</div>
                <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 2 }}>
                  Les om datalagring, opphavsrett og dine GDPR-rettigheter
                </div>
              </div>
            </button>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ width: '100%', color: 'var(--destructive)', justifyContent: 'flex-start', gap: 8 }}
              >
                <Trash2 style={{ width: 16, height: 16 }} />
                Slett konto og alle data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Slett konto og alle data?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette sletter kontoen din og alle data permanent — prosjekter, garn, pinner, bilder og PDF-er.
              Handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              style={{ background: 'var(--destructive)', color: 'white' }}
            >
              {deleting
                ? <><Loader2 style={{ width: 14, height: 14, marginRight: 6 }} className="animate-spin" />Sletter...</>
                : 'Slett konto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
