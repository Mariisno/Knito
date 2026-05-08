import type { KnittingProject } from '../types/knitting';
import { Card, CardContent, CardFooter } from './ui/card';
import { Progress } from './ui/progress';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Package2, Calendar, Plus, Minus } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getStatusColors } from '../utils/progressColors';
import { useTranslation } from '../contexts/LanguageContext';
import { formatDateShort } from '../utils/formatDate';

interface ProjectCardProps {
  project: KnittingProject;
  onClick: () => void;
  onProgressChange?: (projectId: string, newProgress: number) => void;
}

export function ProjectCard({ project, onClick, onProgressChange }: ProjectCardProps) {
  const { t, language } = useTranslation();
  const handleProgressChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    const newProgress = Math.max(0, Math.min(100, project.progress + delta));
    onProgressChange?.(project.id, newProgress);
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 bg-card border-border overflow-hidden"
      onClick={onClick}
    >
      {project.images.length > 0 ? (
        <div className="h-56 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <ImageWithFallback
            src={project.images[0]}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-56 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
          <Package2 className="w-16 h-16 text-amber-300/40" />
        </div>
      )}
      <CardContent className="pt-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-card-foreground line-clamp-1 flex-1">{project.name}</h3>
          <Badge className={`ml-2 ${getStatusColors(project.status)}`}>
            {t(`status.${project.status}`)}
          </Badge>
        </div>
        {project.startDate && (
          <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDateShort(project.startDate, language)}</span>
            {project.endDate && (
              <>
                <span>→</span>
                <span>{formatDateShort(project.endDate, language)}</span>
              </>
            )}
          </div>
        )}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>{t('projectDetail.progress')}</span>
            <div className="flex items-center gap-2">
              {onProgressChange && project.status !== 'Fullført' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    onClick={(e) => handleProgressChange(e, -5)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-primary font-medium w-12 text-center">{project.progress}%</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    onClick={(e) => handleProgressChange(e, 5)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </>
              )}
              {(!onProgressChange || project.status === 'Fullført') && (
                <span className="text-primary font-medium">{project.progress}%</span>
              )}
            </div>
          </div>
          <Progress value={project.progress} className="h-2.5 bg-gradient-to-r from-orange-100 to-rose-100" />
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground border-t border-border/50 pt-4 pb-5 bg-gradient-to-r from-amber-50/30 to-transparent">
        <div className="flex items-center gap-4 flex-wrap">
          {project.yarns.length > 0 && (
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-rose-400" />
              {project.yarns.length} {t('tabs.yarn').toLowerCase()}
            </span>
          )}
          {project.notes && (
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
              {t('common.notes')}
            </span>
          )}
          {project.recipe && (
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-400" />
              {t('projectDetail.pattern')}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
