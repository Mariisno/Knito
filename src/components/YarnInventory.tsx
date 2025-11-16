import type { KnittingProject, Yarn } from '../types/knitting';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Package, Palette } from 'lucide-react';

interface YarnInventoryProps {
  projects: KnittingProject[];
}

interface YarnWithProjects extends Yarn {
  projects: string[];
}

export function YarnInventory({ projects }: YarnInventoryProps) {
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

  const allYarns = Array.from(yarnMap.values()).sort((a, b) => 
    b.projects.length - a.projects.length
  );

  if (allYarns.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
        <p className="text-muted-foreground">Ingen garn registrert enda</p>
        <p className="text-muted-foreground">Legg til garn i prosjektene dine for å se dem her</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-foreground mb-2">Garnlager</h2>
        <p className="text-muted-foreground">
          Oversikt over alle garn brukt i dine prosjekter
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allYarns.map((yarn, index) => (
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
    </div>
  );
}
