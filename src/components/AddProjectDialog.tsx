import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { KnittingProject } from '../types/knitting';
import { Sparkles } from 'lucide-react';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProject: (project: Omit<KnittingProject, 'id' | 'createdAt'>) => void;
}

const PROJECT_TEMPLATES = [
  { name: 'Sokker', category: 'Sokker', notes: 'Tips: Husk å måle fotlengde før du starter!' },
  { name: 'Genser', category: 'Genser', notes: 'Husk å strikke prøvelapp for riktig størrelse' },
  { name: 'Skjerf', category: 'Skjerf', notes: 'Perfekt for nybegynnere!' },
  { name: 'Lue', category: 'Lue', notes: 'Tips: Mål hodeomkrets før du starter' },
  { name: 'Votter', category: 'Votter', notes: 'Husk å strikke to like!' },
  { name: 'Pledd', category: 'Pledd', notes: 'Stort prosjekt - perfekt for TV-strikking' },
  { name: 'Babytøy', category: 'Babytøy', notes: 'Bruk myk og allergivennlig garn' },
  { name: 'Kopp-varmer', category: 'Småting', notes: 'Raskt og koselig prosjekt' },
];

export function AddProjectDialog({ open, onOpenChange, onAddProject }: AddProjectDialogProps) {
  const [name, setName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AddProjectDialog - handleSubmit called');
    console.log('AddProjectDialog - name:', name);
    
    if (name.trim()) {
      console.log('AddProjectDialog - Calling onAddProject with:', {
        name: name.trim(),
        progress: 0,
        status: 'Planlagt',
        images: [],
        yarns: [],
        needles: [],
        counters: [],
      });
      
      onAddProject({
        name: name.trim(),
        progress: 0,
        status: 'Planlagt',
        images: [],
        yarns: [],
        needles: [],
        counters: [],
      });
      setName('');
      setShowTemplates(false);
    } else {
      console.log('AddProjectDialog - Name is empty, not submitting');
    }
  };

  const handleTemplateSelect = (template: typeof PROJECT_TEMPLATES[0]) => {
    console.log('AddProjectDialog - Template selected:', template);
    
    onAddProject({
      name: template.name,
      category: template.category,
      notes: template.notes,
      progress: 0,
      status: 'Planlagt',
      images: [],
      yarns: [],
      needles: [],
      counters: [],
    });
    setName('');
    setShowTemplates(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setShowTemplates(false);
        setName('');
      }
    }}>
      <DialogContent className="bg-card max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nytt strikkeprosjekt</DialogTitle>
        </DialogHeader>

        {!showTemplates ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Prosjektnavn</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. Marius genser"
                className="mt-1.5"
                autoFocus
              />
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowTemplates(true)}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Bruk mal
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Avbryt
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={!name.trim()}>
                  Legg til
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">Velg en mal for å komme raskt i gang:</p>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {PROJECT_TEMPLATES.map((template, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-start text-left hover:border-primary hover:bg-primary/5"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <span className="font-medium">{template.name}</span>
                  <span className="text-muted-foreground mt-1">{template.notes}</span>
                </Button>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowTemplates(false)}>
                Tilbake
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}