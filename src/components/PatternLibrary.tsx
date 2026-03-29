import { useState } from 'react';
import type { KnittingPattern, PatternDifficulty, PatternCategory } from '../types/knitting';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { cn } from './ui/utils';
import { toast } from 'sonner@2.0.3';
import { Plus, ExternalLink, Edit2, Trash2, BookOpen } from 'lucide-react';

const PATTERN_CATEGORIES: PatternCategory[] = [
  'Sokker', 'Genser', 'Skjerf', 'Lue', 'Votter', 'Pledd', 'Babytøy', 'Småting', 'Annet',
];

const DIFFICULTY_COLORS: Record<PatternDifficulty, string> = {
  Lett: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Middels: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Vanskelig: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

interface PatternFormData {
  name: string;
  designer: string;
  url: string;
  difficulty: PatternDifficulty | '';
  category: PatternCategory | '';
  notes: string;
}

const EMPTY_FORM: PatternFormData = {
  name: '', designer: '', url: '', difficulty: '', category: '', notes: '',
};

interface PatternLibraryProps {
  patterns: KnittingPattern[];
  onCreatePattern: (p: KnittingPattern) => void;
  onUpdatePattern: (id: string, updates: Partial<KnittingPattern>) => void;
  onDeletePattern: (id: string) => void;
}

export function PatternLibrary({ patterns, onCreatePattern, onUpdatePattern, onDeletePattern }: PatternLibraryProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<KnittingPattern | null>(null);
  const [form, setForm] = useState<PatternFormData>(EMPTY_FORM);
  const [filterCategory, setFilterCategory] = useState<PatternCategory | 'Alle'>('Alle');
  const [filterDifficulty, setFilterDifficulty] = useState<PatternDifficulty | 'Alle'>('Alle');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = patterns.filter(p => {
    if (filterCategory !== 'Alle' && p.category !== filterCategory) return false;
    if (filterDifficulty !== 'Alle' && p.difficulty !== filterDifficulty) return false;
    return true;
  });

  function openAdd() {
    setEditingPattern(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(p: KnittingPattern) {
    setEditingPattern(p);
    setForm({
      name: p.name,
      designer: p.designer || '',
      url: p.url || '',
      difficulty: p.difficulty || '',
      category: p.category || '',
      notes: p.notes || '',
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error('Navn er påkrevd');
      return;
    }

    const updates: Partial<KnittingPattern> = {
      name: form.name.trim(),
      designer: form.designer.trim() || undefined,
      url: form.url.trim() || undefined,
      difficulty: form.difficulty || undefined,
      category: form.category || undefined,
      notes: form.notes.trim() || undefined,
    };

    if (editingPattern) {
      onUpdatePattern(editingPattern.id, updates);
      toast.success('Oppskrift oppdatert');
    } else {
      const newPattern: KnittingPattern = {
        ...(updates as KnittingPattern),
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      onCreatePattern(newPattern);
      toast.success('Oppskrift lagt til');
    }

    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    onDeletePattern(id);
    setDeletingId(null);
    toast.success('Oppskrift slettet');
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Oppskrifter</h2>
          <span className="text-sm bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
            {patterns.length}
          </span>
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Legg til oppskrift
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(['Alle', ...PATTERN_CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={cn(
              'px-3 py-1 rounded-full text-sm transition-colors',
              filterCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {cat}
          </button>
        ))}
        <select
          value={filterDifficulty}
          onChange={e => setFilterDifficulty(e.target.value as PatternDifficulty | 'Alle')}
          className="ml-auto px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground border border-border"
        >
          <option value="Alle">Alle vanskelighetsgrader</option>
          <option value="Lett">Lett</option>
          <option value="Middels">Middels</option>
          <option value="Vanskelig">Vanskelig</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-2">
            {patterns.length === 0 ? 'Ingen oppskrifter ennå' : 'Ingen oppskrifter matcher filteret'}
          </p>
          {patterns.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Legg til din første oppskrift for å komme i gang
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div
              key={p.id}
              className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all"
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {p.category}
                  </span>
                )}
                {p.difficulty && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', DIFFICULTY_COLORS[p.difficulty])}>
                    {p.difficulty}
                  </span>
                )}
              </div>

              {/* Name + link */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-foreground leading-tight">{p.name}</h3>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              {p.designer && (
                <p className="text-sm text-muted-foreground mb-2">{p.designer}</p>
              )}

              {p.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">{p.notes}</p>
              )}

              {/* Actions */}
              {deletingId === p.id ? (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground flex-1">Slett oppskrift?</span>
                  <button
                    onClick={() => handleDelete(p.id)}
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
                <div className="flex gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Rediger
                  </button>
                  <button
                    onClick={() => setDeletingId(p.id)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Slett
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPattern ? 'Rediger oppskrift' : 'Legg til oppskrift'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Navn <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Oppskriftsnavn"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Designer</label>
              <Input
                placeholder="Designernavn"
                value={form.designer}
                onChange={e => setForm(f => ({ ...f, designer: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">URL</label>
              <Input
                placeholder="https://"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Vanskelighetsgrad</label>
                <select
                  value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as PatternDifficulty | '' }))}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground"
                >
                  <option value="">Velg...</option>
                  <option value="Lett">Lett</option>
                  <option value="Middels">Middels</option>
                  <option value="Vanskelig">Vanskelig</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Kategori</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as PatternCategory | '' }))}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground"
                >
                  <option value="">Velg...</option>
                  {PATTERN_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Notater</label>
              <Textarea
                placeholder="Notater om oppskriften..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleSave}>
              {editingPattern ? 'Lagre endringer' : 'Legg til'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
