import { useState, useEffect } from 'react';
import type { KnittingProject, Yarn, Needle, ProjectStatus } from '../types/knitting';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Trash2, Plus, X, Upload, Calendar, Loader2, Play, Pause, Clock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import * as api from '../utils/api';
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
  onBack: () => void;
  onUpdate: (project: KnittingProject) => void;
  onDelete: (projectId: string) => void;
  accessToken: string;
}

export function ProjectDetail({ project, onBack, onUpdate, onDelete, accessToken }: ProjectDetailProps) {
  const [editedProject, setEditedProject] = useState(project);
  const [newYarn, setNewYarn] = useState<Partial<Yarn>>({});
  const [newNeedle, setNewNeedle] = useState<Partial<Needle>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Sync editedProject when project prop changes
  useEffect(() => {
    setEditedProject(project);
  }, [project]);

  // Update current time every second when timer is running
  useEffect(() => {
    if (editedProject.currentTimeLog?.startTime && !editedProject.currentTimeLog.endTime) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [editedProject.currentTimeLog]);

  const handleUpdate = (updates: Partial<KnittingProject>) => {
    const updated = { ...editedProject, ...updates };
    setEditedProject(updated);
    onUpdate(updated);
  };

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
        id: Date.now().toString(),
        name: newYarn.name,
        brand: newYarn.brand,
        color: newYarn.color,
        amount: newYarn.amount,
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

  const handleAddNeedle = () => {
    if (newNeedle.size?.trim() && newNeedle.type?.trim()) {
      const needle: Needle = {
        id: Date.now().toString(),
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="hover:bg-accent">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Tilbake
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Slett prosjekt
          </Button>
        </div>

        <div className="space-y-8">
          {/* Project Name and Progress */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-4">
              <Input
                value={editedProject.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
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
                <div className="flex items-center justify-between">
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
                  onValueChange={([value]) => handleUpdate({ progress: value })}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="recipe" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-card border border-border shadow-sm">
              <TabsTrigger value="recipe">Oppskrift</TabsTrigger>
              <TabsTrigger value="notes">Notater</TabsTrigger>
              <TabsTrigger value="images">Bilder</TabsTrigger>
              <TabsTrigger value="yarn">Garn</TabsTrigger>
              <TabsTrigger value="needles">Pinner</TabsTrigger>
            </TabsList>

            <TabsContent value="recipe">
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Oppskrift</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editedProject.recipe || ''}
                    onChange={(e) => handleUpdate({ recipe: e.target.value })}
                    placeholder="Skriv inn oppskriften her..."
                    className="min-h-[350px] resize-none"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Notater</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notater</Label>
                    <Textarea
                      id="notes"
                      value={editedProject.notes || ''}
                      onChange={(e) => handleUpdate({ notes: e.target.value })}
                      placeholder="Skriv notater her..."
                      className="min-h-[200px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherInfo">Annen info</Label>
                    <Textarea
                      id="otherInfo"
                      value={editedProject.otherInfo || ''}
                      onChange={(e) => handleUpdate({ otherInfo: e.target.value })}
                      placeholder="F.eks. størrelse, nålestørrelse, strikkefasthet..."
                      className="min-h-[150px] resize-none"
                    />
                  </div>
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
          </Tabs>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil permanent slette prosjektet "{project.name}". Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
