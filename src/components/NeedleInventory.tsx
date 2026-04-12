import { useState } from 'react';
import type { KnittingProject, Needle, NeedleInventoryItem } from '../types/knitting';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2, Scissors, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface NeedleInventoryProps {
  projects: KnittingProject[];
  needleInventory: NeedleInventoryItem[];
  onUpdateNeedleInventory: (needles: NeedleInventoryItem[]) => void;
}

interface NeedleWithProjects extends Needle {
  projects: { id: string, name: string }[];
}

export function NeedleInventory({ projects, needleInventory, onUpdateNeedleInventory }: NeedleInventoryProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newNeedle, setNewNeedle] = useState<Partial<NeedleInventoryItem>>({
    type: 'Rundpinne',
    quantity: 1
  });

  // Aggregate all needles across projects
  const needleMap = new Map<string, NeedleWithProjects>();

  projects.forEach(project => {
    project.needles.forEach(needle => {
      const key = `${needle.type}-${needle.size}-${needle.length || ''}-${needle.material || ''}`;
      if (needleMap.has(key)) {
        const existing = needleMap.get(key)!;
        if (!existing.projects.some(p => p.id === project.id)) {
          existing.projects.push({ id: project.id, name: project.name });
        }
      } else {
        needleMap.set(key, {
          ...needle,
          projects: [{ id: project.id, name: project.name }]
        });
      }
    });
  });

  const projectNeedles = Array.from(needleMap.values()).sort((a, b) => 
    b.projects.length - a.projects.length
  );

  const handleAddNeedle = () => {
    if (!newNeedle.size?.trim()) {
      toast.error('Størrelse er påkrevd (f.eks. 4mm)');
      return;
    }
    if (!newNeedle.type?.trim()) {
      toast.error('Type er påkrevd (f.eks. Rundpinne)');
      return;
    }

    const needle: NeedleInventoryItem = {
      id: crypto.randomUUID(),
      size: newNeedle.size.trim(),
      type: newNeedle.type.trim(),
      length: newNeedle.length?.trim(),
      material: newNeedle.material?.trim(),
      quantity: newNeedle.quantity || 1,
    };

    onUpdateNeedleInventory([...needleInventory, needle]);
    setNewNeedle({ type: 'Rundpinne', quantity: 1 });
    setShowAddDialog(false);
    toast.success('Pinne lagt til i lageret');
  };

  const handleDeleteNeedle = (id: string) => {
    onUpdateNeedleInventory(needleInventory.filter(n => n.id !== id));
    toast.success('Pinne fjernet fra lageret');
  };

  // Calculate usage for inventory items
  const getInUseInfo = (inventoryId: string) => {
    const inUseProjects: string[] = [];
    projects.forEach(p => {
      if (p.needles.some(n => n.inventoryNeedleId === inventoryId)) {
        inUseProjects.push(p.name);
      }
    });
    return inUseProjects;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-foreground mb-2">Verktøy</h2>
        <p className="text-muted-foreground">
          Administrer ditt lager av strikkepinner og se hva som er i bruk
        </p>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border border-border shadow-sm mb-6">
          <TabsTrigger value="inventory">
            Mitt lager ({needleInventory.length})
          </TabsTrigger>
          <TabsTrigger value="all-in-use">
            Alle pinner i bruk ({projectNeedles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <div className="mb-4">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Legg til pinne i lageret
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Legg til i verktøylager</DialogTitle>
                  <DialogDescription>
                    Registrer en ny strikkepinne i din samling.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select
                        value={newNeedle.type}
                        onValueChange={(value) => setNewNeedle({ ...newNeedle, type: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Rundpinne">Rundpinne</SelectItem>
                          <SelectItem value="Strømpepinne">Strømpepinne</SelectItem>
                          <SelectItem value="Settpinner">Settpinner</SelectItem>
                          <SelectItem value="Utskiftbar">Utskiftbar</SelectItem>
                          <SelectItem value="Heklenål">Heklenål</SelectItem>
                          <SelectItem value="Annet">Annet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="needleSize">Størrelse *</Label>
                      <Input
                        id="needleSize"
                        value={newNeedle.size || ''}
                        onChange={(e) => setNewNeedle({ ...newNeedle, size: e.target.value })}
                        placeholder="F.eks. 4mm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="needleLength">Lengde</Label>
                      <Input
                        id="needleLength"
                        value={newNeedle.length || ''}
                        onChange={(e) => setNewNeedle({ ...newNeedle, length: e.target.value })}
                        placeholder="F.eks. 80cm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="needleMaterial">Materiale</Label>
                      <Input
                        id="needleMaterial"
                        value={newNeedle.material || ''}
                        onChange={(e) => setNewNeedle({ ...newNeedle, material: e.target.value })}
                        placeholder="F.eks. Bambus"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="needleQuantity">Antall eid</Label>
                    <Input
                      id="needleQuantity"
                      type="number"
                      min="1"
                      value={newNeedle.quantity || 1}
                      onChange={(e) => setNewNeedle({ ...newNeedle, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddNeedle} className="flex-1">
                      Lagre i lageret
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false);
                        setNewNeedle({ type: 'Rundpinne', quantity: 1 });
                      }}
                      className="flex-1"
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {needleInventory.length === 0 ? (
            <div className="text-center py-16">
              <Scissors className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">Ingen pinner i lageret enda</p>
              <p className="text-muted-foreground">Legg til dine strikkepinner for å holde oversikt over hva du eier</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {needleInventory.map((needle) => {
                const inUseBy = getInUseInfo(needle.id);
                const available = needle.quantity - inUseBy.length;
                
                return (
                  <Card key={needle.id} className="bg-card border-border hover:shadow-lg transition-shadow group relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNeedle(needle.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive z-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between gap-2 pr-8">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-5 h-5 text-primary" />
                          {needle.size} {needle.type}
                        </div>
                        {available <= 0 ? (
                          <Badge variant="destructive" className="shrink-0">Opptatt</Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20">{available} ledig</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {needle.length && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Lengde:</span> {needle.length}
                          </p>
                        )}
                        {needle.material && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Materiale:</span> {needle.material}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Totalt eid:</span> {needle.quantity}
                        </p>
                      </div>

                      {inUseBy.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                            I bruk i:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {inUseBy.map((projectName, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full"
                              >
                                {projectName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-in-use">
          {projectNeedles.length === 0 ? (
            <div className="text-center py-16">
              <Info className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">Ingen pinner er i bruk i aktive prosjekter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectNeedles.map((needle, index) => (
                <Card key={`${needle.id}-${index}`} className="bg-card border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-primary" />
                      {needle.size} {needle.type}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      {needle.length && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Lengde:</span> {needle.length}
                        </p>
                      )}
                      {needle.material && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Materiale:</span> {needle.material}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                        Brukt i {needle.projects.length} prosjekt{needle.projects.length !== 1 ? 'er' : ''}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {needle.projects.map((p, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
