import { useState } from 'react';
import type { KnittingProject, Yarn } from '../types/knitting';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Package, Palette, Plus, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface YarnInventoryProps {
  projects: KnittingProject[];
  standaloneYarns: Yarn[];
  onUpdateStandaloneYarns: (yarns: Yarn[]) => void;
}

interface YarnWithProjects extends Yarn {
  projects: string[];
}

export function YarnInventory({ projects, standaloneYarns, onUpdateStandaloneYarns }: YarnInventoryProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newYarn, setNewYarn] = useState<Partial<Yarn>>({});

  // Aggregate all yarns across projects
  const yarnMap = new Map<string, YarnWithProjects>();

  projects.forEach(project => {
    project.yarns.forEach(yarn => {
      const key = `${yarn.name}-${yarn.brand || ''}-${yarn.color || ''}`;
      if (yarnMap.has(key)) {
        const existing = yarnMap.get(key)!;
        if (!existing.projects.includes(project.name)) {
          existing.projects.push(project.name);
        }
      } else {
        yarnMap.set(key, {
          ...yarn,
          projects: [project.name]
        });
      }
    });
  });

  const projectYarns = Array.from(yarnMap.values()).sort((a, b) => 
    b.projects.length - a.projects.length
  );

  const handleAddStandaloneYarn = () => {
    if (!newYarn.name?.trim()) {
      toast.error('Garnnavn er påkrevd');
      return;
    }

    const yarn: Yarn = {
      id: crypto.randomUUID(),
      name: newYarn.name.trim(),
      brand: newYarn.brand?.trim(),
      color: newYarn.color?.trim(),
      amount: newYarn.amount?.trim(),
      notes: newYarn.notes?.trim(),
    };

    onUpdateStandaloneYarns([...standaloneYarns, yarn]);
    setNewYarn({});
    setShowAddDialog(false);
    toast.success('Restegarn lagt til');
  };

  const handleDeleteStandaloneYarn = (yarnId: string) => {
    onUpdateStandaloneYarns(standaloneYarns.filter(y => y.id !== yarnId));
    toast.success('Restegarn fjernet');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-foreground mb-2">Garnlager</h2>
        <p className="text-muted-foreground">
          Oversikt over garn i prosjekter og restegarn
        </p>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border border-border shadow-sm mb-6">
          <TabsTrigger value="projects">
            Prosjekt-garn ({projectYarns.length})
          </TabsTrigger>
          <TabsTrigger value="standalone">
            Restegarn ({standaloneYarns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {projectYarns.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">Ingen garn registrert enda</p>
              <p className="text-muted-foreground">Legg til garn i prosjektene dine for å se dem her</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectYarns.map((yarn, index) => (
                <Card key={`${yarn.id}-${index}`} className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" />
                      {yarn.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {yarn.brand && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Merke:</span> {yarn.brand}
                      </p>
                    )}
                    {yarn.color && (
                      <p className="text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">Farge:</span> 
                        <span>{yarn.color}</span>
                      </p>
                    )}
                    {yarn.amount && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Mengde:</span> {yarn.amount}
                      </p>
                    )}
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-muted-foreground mb-1">
                        Brukt i {yarn.projects.length} prosjekt{yarn.projects.length !== 1 ? 'er' : ''}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {yarn.projects.map((projectName, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                          >
                            {projectName}
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

        <TabsContent value="standalone">
          <div className="mb-4">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Legg til restegarn
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Legg til restegarn</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="yarnName">Garnnavn *</Label>
                    <Input
                      id="yarnName"
                      value={newYarn.name || ''}
                      onChange={(e) => setNewYarn({ ...newYarn, name: e.target.value })}
                      placeholder="F.eks. Alpakka Ull"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yarnBrand">Merke</Label>
                    <Input
                      id="yarnBrand"
                      value={newYarn.brand || ''}
                      onChange={(e) => setNewYarn({ ...newYarn, brand: e.target.value })}
                      placeholder="F.eks. Sandnes Garn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yarnColor">Farge</Label>
                    <Input
                      id="yarnColor"
                      value={newYarn.color || ''}
                      onChange={(e) => setNewYarn({ ...newYarn, color: e.target.value })}
                      placeholder="F.eks. Mørkeblå"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yarnAmount">Mengde</Label>
                    <Input
                      id="yarnAmount"
                      value={newYarn.amount || ''}
                      onChange={(e) => setNewYarn({ ...newYarn, amount: e.target.value })}
                      placeholder="F.eks. 200g / 2 nøster"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yarnNotes">Notater</Label>
                    <Textarea
                      id="yarnNotes"
                      value={newYarn.notes || ''}
                      onChange={(e) => setNewYarn({ ...newYarn, notes: e.target.value })}
                      placeholder="F.eks. Kjøpt på salg, egnet til sokker..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddStandaloneYarn} className="flex-1">
                      Legg til
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false);
                        setNewYarn({});
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

          {standaloneYarns.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">Ingen restegarn registrert enda</p>
              <p className="text-muted-foreground">Legg til ditt første restegarn ved å klikke knappen ovenfor</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {standaloneYarns.map((yarn) => (
                <Card key={yarn.id} className="bg-card border-border hover:shadow-lg transition-shadow group relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStandaloneYarn(yarn.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive z-10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 pr-8">
                      <Palette className="w-5 h-5 text-primary" />
                      {yarn.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {yarn.brand && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Merke:</span> {yarn.brand}
                      </p>
                    )}
                    {yarn.color && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Farge:</span> {yarn.color}
                      </p>
                    )}
                    {yarn.amount && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Mengde:</span> {yarn.amount}
                      </p>
                    )}
                    {yarn.notes && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {yarn.notes}
                        </p>
                      </div>
                    )}
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
