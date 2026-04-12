import type { KnittingProject } from '../types/knitting';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Activity, CheckCircle2, Clock, PauseCircle, Calendar, Package, TrendingUp, Award, Archive } from 'lucide-react';
import { useProjectStats } from '../hooks/useProjectStats';

interface StatisticsViewProps {
  projects: KnittingProject[];
}

export function StatisticsView({ projects }: StatisticsViewProps) {
  const stats = useProjectStats(projects);

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
        <p className="text-muted-foreground">Ingen statistikk tilgjengelig enda</p>
        <p className="text-muted-foreground">Start med ditt første prosjekt!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-foreground mb-2">Statistikk</h2>
        <p className="text-muted-foreground">
          Oversikt over dine strikkeprosjekter og fremgang
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Totalt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-900 dark:text-amber-100">{stats.total} prosjekter</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200/50 dark:border-emerald-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fullføringsrate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-900 dark:text-emerald-100">{stats.completionRate}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Total tid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-900 dark:text-blue-100">
                {stats.totalTime > 0 
                  ? `${Math.floor(stats.totalTime / 60)}t ${stats.totalTime % 60}m`
                  : 'Ikke registrert'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200/50 dark:border-rose-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                Gjennomsnitt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-rose-900 dark:text-rose-100">{stats.avgProgress}% progresjon</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Status fordeling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-2" />
                <p className="text-2xl font-medium text-amber-900 dark:text-amber-100">{stats.active}</p>
                <p className="text-amber-700 dark:text-amber-300">Aktive</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2" />
                <p className="text-2xl font-medium text-emerald-900 dark:text-emerald-100">{stats.completed}</p>
                <p className="text-emerald-700 dark:text-emerald-300">Fullført</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <PauseCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-2xl font-medium text-blue-900 dark:text-blue-100">{stats.paused}</p>
                <p className="text-blue-700 dark:text-blue-300">På vent</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-2" />
                <p className="text-2xl font-medium text-purple-900 dark:text-purple-100">{stats.planned}</p>
                <p className="text-purple-700 dark:text-purple-300">Planlagt</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                <Archive className="h-5 w-5 text-zinc-600 dark:text-zinc-400 mb-2" />
                <p className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">{stats.archived}</p>
                <p className="text-zinc-700 dark:text-zinc-300">Arkivert</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories and Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats.categories.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Prosjekter etter kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.categories.map(([category, count], index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-foreground">{category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Mer statistikk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-muted-foreground">Prosjekter i år</span>
                <span className="text-foreground font-medium">{stats.projectsThisYear}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-muted-foreground">Totalt garn brukt</span>
                <span className="text-foreground font-medium">{stats.totalYarns}</span>
              </div>
              {stats.avgTimePerProject > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Gj.snitt tid per fullført</span>
                  <span className="text-foreground font-medium">
                    {Math.floor(stats.avgTimePerProject / 60)}t {stats.avgTimePerProject % 60}m
                  </span>
                </div>
              )}
              {stats.totalCost > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Total garnkostnad</span>
                  <span className="text-foreground font-medium">{stats.totalCost} kr</span>
                </div>
              )}
              {stats.avgCostPerProject > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Gj.snitt kostnad per prosjekt</span>
                  <span className="text-foreground font-medium">{stats.avgCostPerProject} kr</span>
                </div>
              )}
              {stats.avgDurationDays > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Gj.snitt varighet (fullført)</span>
                  <span className="text-foreground font-medium">{stats.avgDurationDays} dager</span>
                </div>
              )}
              {stats.longestProject && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Lengste prosjekt</span>
                  <span className="text-foreground font-medium">{stats.longestProject.name} ({stats.longestProject.days}d)</span>
                </div>
              )}
              {stats.mostUsedYarnWeight && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mest brukte garntykkelse</span>
                  <span className="text-foreground font-medium">{stats.mostUsedYarnWeight}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
