import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import type { KnittingProject, Yarn, Needle, ProjectStatus, Counter, LogEntry, NeedleInventoryItem, YarnWeight } from '../types/knitting';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Trash2, Plus, X, Upload, Calendar, Loader2, Play, Pause, Clock, RotateCcw, Send, Archive, Package, Scissors, Download } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import * as api from '../utils/api';
import { exportProjectAsJSON, exportProjectAsPrintable } from '../utils/export';
import { CounterWidget } from './CounterWidget';
import { 
  getProgressColors, 
  getStatusSelectColors, 
  getItemGradient 
} from '../utils/progressColors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ProjectDetailProps {
  project: KnittingProject;
  onBack: (tab?: string) => void;
  onUpdate: (project: KnittingProject) => void;
  onDelete: (projectId: string) => void;
  accessToken: string;
  needleInventory?: NeedleInventoryItem[];
  standaloneYarns?: Yarn[];
}

export function ProjectDetail({ project, onBack, onUpdate, onDelete, accessToken, needleInventory = [], standaloneYarns = [] }: ProjectDetailProps) {
  const [editedProject, setEditedProject] = useState(project);
  const [newYarn, setNewYarn] = useState<Partial<Yarn>>({});
  const [newNeedle, setNewNeedle] = useState<Partial<Needle>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newLogEntry, setNewLogEntry] = useState('');

  // Update current time every second when timer is running
  useEffect(() => {
    if (editedProject.currentTimeLog?.startTime && !editedProject.currentTimeLog.endTime) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [editedProject.currentTimeLog]);

  // Debounced version of onUpdate for text fields and slider
  const debouncedOnUpdate = useDebouncedCallback(
    (updated: KnittingProject) => onUpdate(updated),
    500,
  );

  // Immediate update: updates local state + calls API immediately
  const handleUpdate = (updates: Partial<KnittingProject>) => {
    const updated = { ...editedProject, ...updates };
    setEditedProject(updated);
    onUpdate(updated);
  };

  // Debounced update: updates local state immediately, debounces the API call
  const handleDebouncedUpdate = useCallback((updates: Partial<KnittingProject>) => {
    setEditedProject(prev => {
      const updated = { ...prev, ...updates };
      debouncedOnUpdate(updated);
      return updated;
    });
  }, [debouncedOnUpdate]);

  const handleToggleTimer = () => {
    if (editedProject.currentTimeLog?.startTime && !editedProject.currentTimeLog.endTime) {
      // Stop timer
      const startTime = new Date(editedProject.currentTimeLog.startTime);
      const endTime = new Date();
      const minutesElapsed = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      handleUpdate({
        timeSpentMinutes: (editedProject.timeSpentMinutes || 0) + minutesElapsed,
        currentTimeLog: undefined,
      });
      toast.success(`${minutesElapsed} minutter lagt til`);
    } else {
      // Start timer
      handleUpdate({
        currentTimeLog: {
          startTime: new Date(),
        },
      });
      toast.success('Tidtaker startet');
    }
  };

  const getTimerDisplay = () => {
    if (!editedProject.currentTimeLog?.startTime) return null;
    
    const startTime = new Date(editedProject.currentTimeLog.startTime);
    const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddYarn = () => {
    if (newYarn.name?.trim()) {
      const yarn: Yarn = {
        id: crypto.randomUUID(),
        name: newYarn.name,
        brand: newYarn.brand,
        color: newYarn.color,
        amount: newYarn.amount,
        weight: newYarn.weight,
        fiberContent: newYarn.fiberContent,
        yardage: newYarn.yardage,
        dyeLot: newYarn.dyeLot,
        price: newYarn.price,
      };
      handleUpdate({ yarns: [...editedProject.yarns, yarn] });
      setNewYarn({});
      toast.success('Garn lagt til');
    }
  };

  const handleRemoveYarn = (yarnId: string) => {
    handleUpdate({ yarns: editedProject.yarns.filter(y => y.id !== yarnId) });
    toast.success('Garn fjernet');
  };

  const handlePickStandaloneYarn = (standaloneYarn: Yarn) => {
    const yarn: Yarn = {
      id: crypto.randomUUID(),
      name: standaloneYarn.name,
      brand: standaloneYarn.brand,
      color: standaloneYarn.color,
      amount: standaloneYarn.amount,
      weight: standaloneYarn.weight,
      fiberContent: standaloneYarn.fiberContent,
      yardage: standaloneYarn.yardage,
      dyeLot: standaloneYarn.dyeLot,
      price: standaloneYarn.price,
      standaloneYarnId: standaloneYarn.id,
    };
    handleUpdate({ yarns: [...editedProject.yarns, yarn] });
    toast.success(`${standaloneYarn.name} lagt til fra restegarn`);
  };

  const handleAddNeedle = () => {
    if (newNeedle.size?.trim() && newNeedle.type?.trim()) {
      const needle: Needle = {
        id: crypto.randomUUID(),
        size: newNeedle.size,
        type: newNeedle.type,
        length: newNeedle.length,
        material: newNeedle.material,
      };
      handleUpdate({ needles: [...(editedProject.needles || []), needle] });
      setNewNeedle({});
      toast.success('Pinne lagt til');
    }
  };

  const handleRemoveNeedle = (needleId: string) => {
    handleUpdate({ needles: (editedProject.needles || []).filter(n => n.id !== needleId) });
    toast.success('Pinne fjernet');
  };

  const handlePickInventoryNeedle = (invNeedle: NeedleInventoryItem) => {
    const needle: Needle = {
      id: crypto.randomUUID(),
      size: invNeedle.size,
      type: invNeedle.type,
      length: invNeedle.length,
      material: invNeedle.material,
      inventoryNeedleId: invNeedle.id,
    };
    handleUpdate({ needles: [...(editedProject.needles || []), needle] });
    toast.success(`${invNeedle.type} ${invNeedle.size} lagt til fra beholdning`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const fileArray = Array.from(files);
    
    try {
      const uploadPromises = fileArray.map(file => api.uploadImage(file, accessToken));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      handleUpdate({ images: [...editedProject.images, ...uploadedUrls] });
      toast.success(`${files.length} ${files.length === 1 ? 'bilde' : 'bilder'} lastet opp`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Kunne ikke laste opp bilder');
    } finally {
      setUploadingImages(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = editedProject.images.filter((_, i) => i !== index);
    handleUpdate({ images: newImages });
    toast.success('Bilde fjernet');
  };

  const handleDelete = () => {
    onDelete(project.id);
  };

  const handleAddCounter = () => {
    const newCounter: Counter = {
      id: crypto.randomUUID(),
      label: 'Runder',
      count: 0,
    };
    handleUpdate({ counters: [...(editedProject.counters || []), newCounter] });
    toast.success('Teller lagt til');
  };

  const handleUpdateCounter = (updatedCounter: Counter) => {
    const counters = (editedProject.counters || []).map(c => 
      c.id === updatedCounter.id ? updatedCounter : c
    );
    handleUpdate({ counters });
  };

  const handleRemoveCounter = (counterId: string) => {
    handleUpdate({ counters: (editedProject.counters || []).filter(c => c.id !== counterId) });
    toast.success('Teller fjernet');
  };

  const handleResetTime = () => {
    if (editedProject.currentTimeLog?.startTime) {
      toast.error('Stopp tidtakeren først');
      return;
    }
    handleUpdate({ timeSpentMinutes: 0 });
    toast.success('Tid tilbakestilt');
  };

  const handleAddLogEntry = () => {
    if (!newLogEntry.trim()) return;
    
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      text: newLogEntry.trim(),
      timestamp: new Date(),
    };
    
    handleUpdate({ 
      logEntries: [...(editedProject.logEntries || []), logEntry] 
    });
    setNewLogEntry('');
    toast.success('Logg-innlegg lagt til');
  };

  const handleDeleteLogEntry = (logId: string) => {
    handleUpdate({ 
      logEntries: (editedProject.logEntries || []).filter(entry => entry.id !== logId) 
    });
    toast.success('Logg-innlegg slettet');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => onBack()} className="hover:bg-accent" title="Tilbake (Esc)">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Tilbake
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exportProjectAsPrintable(editedProject);
                toast.success('Prosjekt eksportert');
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Eksporter
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Slett / Arkiver
            </Button>
          </div>
        </div>

        {/* Quick navigation to other sections */}
        <div className="flex gap-2 mb-6 pb-4 border-b border-border">
          <span className="text-sm text-muted-foreground self-center mr-2">Gå til:</span>
          <Button variant="outline" size="sm" onClick={() => onBack('garnlager')}>Garnlager</Button>
          <Button variant="outline" size="sm" onClick={() => onBack('verktoy')}>Verktøy</Button>
          <Button variant="outline" size="sm" onClick={() => onBack('statistikk')}>Statistikk</Button>
        </div>

        <div className="space-y-8">
          {/* Project Name and Progress */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-4">
              <Input
                value={editedProject.name}
                onChange={(e) => handleDebouncedUpdate({ name: e.target.value })}
                className="border-0 p-0 text-card-foreground focus:ring-0 text-2xl"
              />
              {editedProject.category && (
                <p className="text-muted-foreground mt-2">
                  Kategori: {editedProject.category}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-border">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editedProject.status}
                    onValueChange={(value: ProjectStatus) => handleUpdate({ status: value })}
                  >
                    <SelectTrigger className={`w-full ${getStatusSelectColors(editedProject.status)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planlagt">Planlagt</SelectItem>
                      <SelectItem value="Aktiv">Aktiv</SelectItem>
                      <SelectItem value="På vent">På vent</SelectItem>
                      <SelectItem value="Fullført">Fullført</SelectItem>
                      <SelectItem value="Arkivert">Arkivert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Startdato</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {editedProject.startDate
                          ? format(new Date(editedProject.startDate), 'PPP', { locale: nb })
                          : 'Velg dato'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={editedProject.startDate ? new Date(editedProject.startDate) : undefined}
                        onSelect={(date) => handleUpdate({ startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Sluttdato</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {editedProject.endDate
                          ? format(new Date(editedProject.endDate), 'PPP', { locale: nb })
                          : 'Velg dato'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={editedProject.endDate ? new Date(editedProject.endDate) : undefined}
                        onSelect={(date) => handleUpdate({ endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* Timer Section */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <Label>Tid brukt</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-2xl font-medium text-foreground">
                        {editedProject.timeSpentMinutes 
                          ? `${Math.floor(editedProject.timeSpentMinutes / 60)}t ${editedProject.timeSpentMinutes % 60}m`
                          : '0t 0m'}
                      </p>
                      {editedProject.currentTimeLog?.startTime && (
                        <p className="text-lg text-muted-foreground">
                          + {getTimerDisplay()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleToggleTimer}
                      size="lg"
                      className={editedProject.currentTimeLog?.startTime 
                        ? "bg-destructive hover:bg-destructive/90" 
                        : "bg-primary hover:bg-primary/90"}
                    >
                      {editedProject.currentTimeLog?.startTime ? (
                        <>
                          <Pause className="mr-2 h-5 w-5" />
                          Stopp
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {editedProject.timeSpentMinutes > 0 && (
                  <div className="flex justify-end pt-2 border-t border-primary/10">
                    <Button
                      onClick={handleResetTime}
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={!!editedProject.currentTimeLog?.startTime}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Tilbakestill tid
                    </Button>
                  </div>
                )}
              </div>

              {/* Counters Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">Tellere</Label>
                  <Button
                    onClick={handleAddCounter}
                    size="sm"
                    variant="outline"
                    className="border-purple-300 dark:border-purple-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Legg til teller
                  </Button>
                </div>

                {(!editedProject.counters || editedProject.counters.length === 0) ? (
                  <div className="text-center py-8 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-rose-950/20 rounded-lg border-2 border-dashed border-purple-200 dark:border-purple-800">
                    <p className="text-muted-foreground mb-2">Ingen tellere lagt til ennå</p>
                    <p className="text-muted-foreground/60 text-sm">Legg til en teller for å holde styr på runder eller masker</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editedProject.counters.map((counter) => (
                      <CounterWidget
                        key={counter.id}
                        counter={counter}
                        onUpdate={handleUpdateCounter}
                        onRemove={handleRemoveCounter}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between mb-3">
                  <Label>Progresjon</Label>
                  <span className={`font-medium px-4 py-1.5 rounded-full border transition-colors duration-300 ${getProgressColors(editedProject.progress).badge}`}>
                    {editedProject.progress}%
                  </span>
                </div>
                <Progress 
                  value={editedProject.progress} 
                  className={`h-3 mb-5 ${getProgressColors(editedProject.progress).progressBar}`}
                  barClassName={`h-full transition-all duration-500 ease-out shadow-sm ${getProgressColors(editedProject.progress).progressBarFill}`}
                />
                <Slider
                  value={[editedProject.progress]}
                  onValueChange={([value]) => handleDebouncedUpdate({ progress: value })}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 bg-card border border-border shadow-sm">
              <TabsTrigger value="notes">Logg</TabsTrigger>
              <TabsTrigger value="recipe">Oppskrift</TabsTrigger>
              <TabsTrigger value="images">Bilder</TabsTrigger>
              <TabsTrigger value="yarn">Garn</TabsTrigger>
              <TabsTrigger value="needles">Pinner</TabsTrigger>
              <TabsTrigger value="gauge">Strikkefasthet</TabsTrigger>
              <TabsTrigger value="pattern">Mønster</TabsTrigger>
            </TabsList>

            <TabsContent value="notes">
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Logg & Notater</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add new log entry */}
                  <div className="space-y-2">
                    <Label htmlFor="newLogEntry">Nytt logg-innlegg</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="newLogEntry"
                        value={newLogEntry}
                        onChange={(e) => setNewLogEntry(e.target.value)}
                        placeholder="Skriv et nytt innlegg i loggen..."
                        className="min-h-[80px] resize-none flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleAddLogEntry();
                          }
                        }}
                      />
                      <Button
                        onClick={handleAddLogEntry}
                        disabled={!newLogEntry.trim()}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Trykk Cmd/Ctrl+Enter for å legge til</p>
                  </div>

                  {/* Log entries list */}
                  <div className="space-y-3">
                    <Label>Logg-historikk</Label>
                    {(!editedProject.logEntries || editedProject.logEntries.length === 0) ? (
                      <p className="text-sm text-muted-foreground italic py-8 text-center">
                        Ingen logg-innlegg ennå. Legg til ditt første innlegg ovenfor!
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {[...(editedProject.logEntries || [])].reverse().map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-accent/30 rounded-lg p-4 border border-border hover:border-primary/30 transition-colors group"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 space-y-1">
                                <p className="text-sm whitespace-pre-wrap break-words">{entry.text}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(entry.timestamp), 'PPP \'kl.\' HH:mm', { locale: nb })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLogEntry(entry.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>


                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipe">
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Oppskrift</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editedProject.recipe || ''}
                    onChange={(e) => handleDebouncedUpdate({ recipe: e.target.value })}
                    placeholder="Skriv inn oppskriften her..."
                    className="min-h-[350px] resize-none"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Bilder</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={uploadingImages}
                      />
                      <Label 
                        htmlFor="image-upload"
                        className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-md ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploadingImages ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Laster opp...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Last opp bilder
                          </>
                        )}
                      </Label>
                    </div>

                    {editedProject.images.length === 0 ? (
                      <div className="text-center py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-lg border border-border/50">
                        <div className="bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-md">
                          <Upload className="w-10 h-10 text-primary" />
                        </div>
                        <p className="text-muted-foreground mb-1">Ingen bilder lastet opp ennå</p>
                        <p className="text-muted-foreground/60">Klikk på knappen over for å laste opp bilder av prosjektet ditt</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {editedProject.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <ImageWithFallback
                              src={image}
                              alt={`Prosjektbilde ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-border"
                            />
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="yarn">
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Garn brukt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Existing yarns */}
                  {editedProject.yarns.length > 0 && (
                    <div className="space-y-3">
                      {editedProject.yarns.map((yarn, index) => (
                          <div key={yarn.id} className={`flex items-start justify-between p-5 bg-gradient-to-br ${getItemGradient(index)} rounded-lg border border-border/50 hover:border-primary/30 transition-all hover:shadow-md`}>
                            <div className="space-y-1">
                              <div className="text-card-foreground font-medium">{yarn.name}</div>
                              {yarn.brand && <div className="text-muted-foreground">Merke: {yarn.brand}</div>}
                              {yarn.color && <div className="text-muted-foreground">Farge: {yarn.color}</div>}
                              {yarn.amount && <div className="text-muted-foreground">Mengde: {yarn.amount}</div>}
                              {yarn.weight && <div className="text-muted-foreground">Tykkelse: {yarn.weight}</div>}
                              {yarn.fiberContent && <div className="text-muted-foreground">Fiber: {yarn.fiberContent}</div>}
                              {yarn.yardage && <div className="text-muted-foreground">Løpelengde: {yarn.yardage}</div>}
                              {yarn.dyeLot && <div className="text-muted-foreground">Fargebad: {yarn.dyeLot}</div>}
                              {yarn.price != null && yarn.price > 0 && <div className="text-muted-foreground">Pris: {yarn.price} kr</div>}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveYarn(yarn.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                      ))}
                    </div>
                  )}

                  {/* Pick from standalone yarn inventory */}
                  {standaloneYarns.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-card-foreground">Velg fra restegarn</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {standaloneYarns.map((yarn) => (
                          <button
                            key={yarn.id}
                            onClick={() => handlePickStandaloneYarn(yarn)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 hover:border-primary/50 hover:shadow-md transition-all text-left"
                          >
                            <Package className="h-5 w-5 text-purple-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{yarn.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {[yarn.brand, yarn.color, yarn.amount].filter(Boolean).join(' · ') || 'Restegarn'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-sm pt-2">
                        <div className="flex-1 h-px bg-border" />
                        <span>eller skriv inn manuelt</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    </div>
                  )}

                  {/* Add new yarn */}
                  <div className="border-t border-border pt-6">
                    <h4 className="text-card-foreground mb-4">Legg til nytt garn</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="yarnName">Garnnavn *</Label>
                        <Input
                          id="yarnName"
                          value={newYarn.name || ''}
                          onChange={(e) => setNewYarn({ ...newYarn, name: e.target.value })}
                          placeholder="F.eks. Alpakka"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yarnBrand">Merke</Label>
                        <Input
                          id="yarnBrand"
                          value={newYarn.brand || ''}
                          onChange={(e) => setNewYarn({ ...newYarn, brand: e.target.value })}
                          placeholder="F.eks. Dale Garn"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yarnColor">Farge</Label>
                        <Input
                          id="yarnColor"
                          value={newYarn.color || ''}
                          onChange={(e) => setNewYarn({ ...newYarn, color: e.target.value })}
                          placeholder="F.eks. Mørk blå"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yarnAmount">Mengde</Label>
                        <Input
                          id="yarnAmount"
                          value={newYarn.amount || ''}
                          onChange={(e) => setNewYarn({ ...newYarn, amount: e.target.value })}
                          placeholder="F.eks. 300g"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yarnWeight">Tykkelse</Label>
                        <select
                          id="yarnWeight"
                          value={newYarn.weight || ''}
                          onChange={(e) => setNewYarn({ ...newYarn, weight: (e.target.value || undefined) as YarnWeight | undefined })}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Velg tykkelse...</option>
                          <option value="Lace">Lace</option>
                          <option value="Fingering">Fingering</option>
                          <option value="Sport">Sport</option>
                          <option value="DK">DK</option>
                          <option value="Worsted">Worsted</option>
                          <option value="Aran">Aran</option>
                          <option value="Bulky">Bulky</option>
                          <option value="Super Bulky">Super Bulky</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yarnFiber">Fiberinnhold</Label>
                        <Input
                          id="yarnFiber"
                          value={newYarn.fiberContent || ''}
                          onChange={(e) => setNewYarn({ ...newYarn, fiberContent: e.target.value })}
                          placeholder="F.eks. 100% Merino"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yarnYardage">Løpelengde</Label>
                        <Input
                          id="yarnYardage"
                          value={newYarn.yardage || ''}
                          onChange={(e) => setNewYarn({ ...newYarn, yardage: e.target.value })}
                          placeholder="F.eks. 200m per 50g"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yarnDyeLot">Fargebad</Label>
                        <Input
                          id="yarnDyeLot"
                          value={newYarn.dyeLot || ''}
                          onChange={(e) => setNewYarn({ ...newYarn, dyeLot: e.target.value })}
                          placeholder="F.eks. Lot 2345"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yarnPrice">Pris (kr)</Label>
                        <Input
                          id="yarnPrice"
                          type="number"
                          value={newYarn.price || ''}
                          onChange={(e) => setNewYarn({ ...newYarn, price: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="F.eks. 89"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddYarn}
                      disabled={!newYarn.name?.trim()}
                      className="mt-4 bg-primary hover:bg-primary/90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Legg til garn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="needles">
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Pinner brukt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Existing needles */}
                  {(editedProject.needles || []).length > 0 && (
                    <div className="space-y-3">
                      {editedProject.needles.map((needle, index) => (
                          <div key={needle.id} className={`flex items-start justify-between p-5 bg-gradient-to-br ${getItemGradient(index)} rounded-lg border border-border/50 hover:border-primary/30 transition-all hover:shadow-md`}>
                            <div className="space-y-1">
                              <div className="text-card-foreground font-medium">{needle.type} - {needle.size}</div>
                              {needle.length && <div className="text-muted-foreground">Lengde: {needle.length}</div>}
                              {needle.material && <div className="text-muted-foreground">Materiale: {needle.material}</div>}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveNeedle(needle.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                      ))}
                    </div>
                  )}

                  {/* Pick from needle inventory */}
                  {needleInventory.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-card-foreground">Velg fra beholdning</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {needleInventory.map((invNeedle) => (
                          <button
                            key={invNeedle.id}
                            onClick={() => handlePickInventoryNeedle(invNeedle)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 hover:border-primary/50 hover:shadow-md transition-all text-left"
                          >
                            <Scissors className="h-5 w-5 text-amber-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{invNeedle.type} {invNeedle.size}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {[invNeedle.length, invNeedle.material].filter(Boolean).join(' · ') || 'Strikkepinne'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-sm pt-2">
                        <div className="flex-1 h-px bg-border" />
                        <span>eller skriv inn manuelt</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    </div>
                  )}

                  {/* Add new needle */}
                  <div className="border-t border-border pt-6">
                    <h4 className="text-card-foreground mb-4">Legg til ny pinne</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="needleSize">Størrelse *</Label>
                        <Input
                          id="needleSize"
                          value={newNeedle.size || ''}
                          onChange={(e) => setNewNeedle({ ...newNeedle, size: e.target.value })}
                          placeholder="F.eks. 4mm eller 5.0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="needleType">Type *</Label>
                        <Input
                          id="needleType"
                          value={newNeedle.type || ''}
                          onChange={(e) => setNewNeedle({ ...newNeedle, type: e.target.value })}
                          placeholder="F.eks. Rundpinne, Strikkepinne"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="needleLength">Lengde</Label>
                        <Input
                          id="needleLength"
                          value={newNeedle.length || ''}
                          onChange={(e) => setNewNeedle({ ...newNeedle, length: e.target.value })}
                          placeholder="F.eks. 80cm, 100cm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="needleMaterial">Materiale</Label>
                        <Input
                          id="needleMaterial"
                          value={newNeedle.material || ''}
                          onChange={(e) => setNewNeedle({ ...newNeedle, material: e.target.value })}
                          placeholder="F.eks. Tre, Metall, Bambus"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddNeedle}
                      disabled={!newNeedle.size?.trim() || !newNeedle.type?.trim()}
                      className="mt-4 bg-primary hover:bg-primary/90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Legg til pinne
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gauge">
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Strikkefasthet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground text-sm">Registrer strikkefastheten din for dette prosjektet.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gaugeStitches">Masker per 10 cm</Label>
                      <Input
                        id="gaugeStitches"
                        type="number"
                        value={editedProject.gauge?.stitchesPer10cm || ''}
                        onChange={(e) => handleDebouncedUpdate({ gauge: { ...editedProject.gauge, stitchesPer10cm: e.target.value ? Number(e.target.value) : undefined } })}
                        placeholder="F.eks. 22"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gaugeRows">Pinner/omganger per 10 cm</Label>
                      <Input
                        id="gaugeRows"
                        type="number"
                        value={editedProject.gauge?.rowsPer10cm || ''}
                        onChange={(e) => handleDebouncedUpdate({ gauge: { ...editedProject.gauge, rowsPer10cm: e.target.value ? Number(e.target.value) : undefined } })}
                        placeholder="F.eks. 30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gaugeNeedle">Pinnestørrelse brukt</Label>
                      <Input
                        id="gaugeNeedle"
                        value={editedProject.gauge?.needleSize || ''}
                        onChange={(e) => handleDebouncedUpdate({ gauge: { ...editedProject.gauge, needleSize: e.target.value } })}
                        placeholder="F.eks. 4mm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gaugeNotes">Notater</Label>
                      <Input
                        id="gaugeNotes"
                        value={editedProject.gauge?.notes || ''}
                        onChange={(e) => handleDebouncedUpdate({ gauge: { ...editedProject.gauge, notes: e.target.value } })}
                        placeholder="F.eks. Vasket og blokkert"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pattern">
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Mønster</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground text-sm">Koble til et mønster og spor fremgangen din.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patternName">Mønsternavn</Label>
                      <Input
                        id="patternName"
                        value={editedProject.pattern?.name || ''}
                        onChange={(e) => handleDebouncedUpdate({ pattern: { ...editedProject.pattern, name: e.target.value } })}
                        placeholder="F.eks. Riddari"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patternDesigner">Designer</Label>
                      <Input
                        id="patternDesigner"
                        value={editedProject.pattern?.designer || ''}
                        onChange={(e) => handleDebouncedUpdate({ pattern: { ...editedProject.pattern, designer: e.target.value } })}
                        placeholder="F.eks. Védís Jónsdóttir"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="patternUrl">Lenke til mønster</Label>
                      <Input
                        id="patternUrl"
                        value={editedProject.pattern?.url || ''}
                        onChange={(e) => handleDebouncedUpdate({ pattern: { ...editedProject.pattern, url: e.target.value } })}
                        placeholder="F.eks. https://www.ravelry.com/patterns/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patternCurrentRow">Nåværende rad</Label>
                      <Input
                        id="patternCurrentRow"
                        type="number"
                        value={editedProject.pattern?.currentRow || ''}
                        onChange={(e) => handleDebouncedUpdate({ pattern: { ...editedProject.pattern, currentRow: e.target.value ? Number(e.target.value) : undefined } })}
                        placeholder="F.eks. 47"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patternTotalRows">Totalt antall rader</Label>
                      <Input
                        id="patternTotalRows"
                        type="number"
                        value={editedProject.pattern?.totalRows || ''}
                        onChange={(e) => handleDebouncedUpdate({ pattern: { ...editedProject.pattern, totalRows: e.target.value ? Number(e.target.value) : undefined } })}
                        placeholder="F.eks. 200"
                      />
                    </div>
                  </div>
                  {editedProject.pattern?.currentRow && editedProject.pattern?.totalRows && editedProject.pattern.totalRows > 0 && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Mønsterfremgang</span>
                        <span>{Math.round((editedProject.pattern.currentRow / editedProject.pattern.totalRows) * 100)}%</span>
                      </div>
                      <Progress
                        value={(editedProject.pattern.currentRow / editedProject.pattern.totalRows) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                  {editedProject.pattern?.url && (
                    <div className="pt-4 border-t border-border">
                      <a
                        href={editedProject.pattern.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                      >
                        Åpne mønster i ny fane
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Hva vil du gjøre med prosjektet?</AlertDialogTitle>
            <AlertDialogDescription>
              Du kan arkivere prosjektet "{project.name}" for å skjule det fra listen, eller slette det permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleUpdate({ status: 'Arkivert' as ProjectStatus })}
              className="bg-zinc-600 hover:bg-zinc-700"
            >
              <Archive className="mr-2 h-4 w-4" />
              Arkiver
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Slett permanent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
