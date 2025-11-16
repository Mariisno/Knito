import { useState, useMemo } from 'react';
import type { KnittingProject, ProjectStatus } from '../types/knitting';
import { ProjectCard } from './ProjectCard';
import { Package2, Sparkles, Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface ProjectListProps {
  projects: KnittingProject[];
  onSelectProject: (id: string) => void;
  onProgressChange?: (projectId: string, newProgress: number) => void;
}

export function ProjectList({ projects, onSelectProject, onProgressChange }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'Alle'>('Aktiv');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'date'>('date');

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        project.recipe?.toLowerCase().includes(query) ||
        project.notes?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'Alle') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progress - a.progress;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [projects, searchQuery, statusFilter, sortBy]);

  if (projects.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-lg">
          <Package2 className="w-16 h-16 text-primary" />
        </div>
        <h3 className="text-foreground mb-2">Ingen prosjekter ennå</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Kom i gang med ditt første strikkeprosjekt ved å klikke på "Nytt prosjekt" knappen
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground/60">
          <Sparkles className="w-4 h-4" />
          <span>Tips: Du kan legge til bilder, oppskrifter og notater til hvert prosjekt</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search and Filter Controls */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Søk etter prosjekt, oppskrift eller notater..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['Alle', 'Aktiv', 'Planlagt', 'På vent', 'Fullført'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status ? 'shadow-md' : ''}
              >
                {status}
              </Button>
            ))}
          </div>

          {/* Sort */}
          <div className="ml-auto flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
            >
              Dato
            </Button>
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('name')}
            >
              Navn
            </Button>
            <Button
              variant={sortBy === 'progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('progress')}
            >
              Progresjon
            </Button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-muted-foreground">
          Viser {filteredProjects.length} av {projects.length} prosjekter
        </p>
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground mb-2">Ingen prosjekter funnet</p>
          <p className="text-muted-foreground/60">Prøv å endre søket eller filteret</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project.id)}
              onProgressChange={onProgressChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
