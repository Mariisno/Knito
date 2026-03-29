import { useState } from 'react';
import type { KnittingTool, ToolType } from '../types/knitting';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { cn } from './ui/utils';
import { toast } from 'sonner@2.0.3';
import { Plus, Wrench } from 'lucide-react';

const TOOL_TYPES: ToolType[] = [
  'Rundpinne', 'Strømpepinne', 'Heklenål', 'Nålespiss', 'Strikkemerke', 'Annet',
];

const TYPE_COLORS: Record<ToolType, string> = {
  Rundpinne: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Strømpepinne: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Heklenål: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Nålespiss: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Strikkemerke: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Annet: 'bg-muted text-muted-foreground',
};

interface ToolFormData {
  name: string;
  type: ToolType | '';
  size: string;
  length: string;
  material: string;
  quantity: string;
  notes: string;
}

const EMPTY_FORM: ToolFormData = {
  name: '', type: '', size: '', length: '', material: '', quantity: '', notes: '',
};

interface ToolInventoryProps {
  tools: KnittingTool[];
  onUpdateTools: (tools: KnittingTool[]) => void;
}

export function ToolInventory({ tools, onUpdateTools }: ToolInventoryProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ToolFormData>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleAdd() {
    if (!form.name.trim()) {
      toast.error('Navn er påkrevd');
      return;
    }
    if (!form.type) {
      toast.error('Type er påkrevd');
      return;
    }

    const newTool: KnittingTool = {
      id: Date.now().toString(),
      name: form.name.trim(),
      type: form.type as ToolType,
      size: form.size.trim() || undefined,
      length: form.length.trim() || undefined,
      material: form.material.trim() || undefined,
      quantity: form.quantity ? parseInt(form.quantity, 10) : undefined,
      notes: form.notes.trim() || undefined,
    };

    onUpdateTools([...tools, newTool]);
    toast.success('Verktøy lagt til');
    setDialogOpen(false);
    setForm(EMPTY_FORM);
  }

  function handleDelete(id: string) {
    onUpdateTools(tools.filter(t => t.id !== id));
    setDeletingId(null);
    toast.success('Verktøy slettet');
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Verktøy</h2>
          <span className="text-sm bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
            {tools.length}
          </span>
        </div>
        <Button
          onClick={() => { setForm(EMPTY_FORM); setDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Legg til verktøy
        </Button>
      </div>

      {/* Grid */}
      {tools.length === 0 ? (
        <div className="text-center py-20">
          <Wrench className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Ingen verktøy ennå</p>
          <p className="text-muted-foreground text-sm">
            Legg til pinner, heklenåler og annet utstyr
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(t => (
            <div
              key={t.id}
              className="group bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{t.name}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full inline-block mt-1', TYPE_COLORS[t.type])}>
                    {t.type}
                  </span>
                </div>
                {t.quantity && t.quantity > 1 && (
                  <span className="text-sm text-muted-foreground font-medium shrink-0">×{t.quantity}</span>
                )}
              </div>

              <div className="text-sm text-muted-foreground space-y-0.5 mt-2">
                {t.size && <p>Størrelse: {t.size}</p>}
                {t.length && <p>Lengde: {t.length}</p>}
                {t.material && <p>Materiale: {t.material}</p>}
              </div>

              {t.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{t.notes}</p>
              )}

              {deletingId === t.id ? (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground flex-1">Slett verktøy?</span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-sm text-rose-600 dark:text-rose-400 hover:underline font-medium"
                  >
                    Ja
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    Nei
                  </button>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setDeletingId(t.id)}
                    className="text-sm text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    Slett
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Legg til verktøy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Navn <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Navn på verktøyet"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as ToolType | '' }))}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground"
              >
                <option value="">Velg type...</option>
                {TOOL_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Størrelse</label>
                <Input
                  placeholder="f.eks. 4mm"
                  value={form.size}
                  onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Lengde</label>
                <Input
                  placeholder="f.eks. 80cm"
                  value={form.length}
                  onChange={e => setForm(f => ({ ...f, length: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Materiale</label>
                <Input
                  placeholder="f.eks. Bambus"
                  value={form.material}
                  onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Antall</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Notater</label>
              <Textarea
                placeholder="Notater..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleAdd}>Legg til</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
