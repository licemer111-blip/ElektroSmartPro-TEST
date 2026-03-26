"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  startTimer,
  stopTimer,
  addManualTimeEntry,
  deleteTimeEntry,
} from "@/app/dashboard/time/actions";
import { formatDuration, type TimeEntry } from "@/app/dashboard/time/utils";
import {
  Clock, Play, Square, Plus, Trash2, Loader2,
  Calendar, Timer, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
}

interface TimeSummary {
  today: number;
  week: number;
  month: number;
  runningTimer: TimeEntry | null;
}

interface TimeTrackingDashboardProps {
  timeEntries: TimeEntry[];
  summary: TimeSummary;
  projects: Project[];
}

export function TimeTrackingDashboard({
  timeEntries,
  summary,
  projects
}: TimeTrackingDashboardProps) {
  const [runningTimer, setRunningTimer] = useState<TimeEntry | null>(summary.runningTimer);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [description, setDescription] = useState("");
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const router = useRouter();

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!runningTimer) return;

    const startTime = new Date(runningTimer.started_at).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [runningTimer]);

  const handleStartTimer = async () => {
    if (!selectedProject) {
      toast.error("Wybierz projekt");
      return;
    }

    setLoading(true);
    try {
      const result = await startTimer(selectedProject, description);
      if (result.error) {
        toast.error(result.error);
      } else if (result.entry) {
        setRunningTimer(result.entry);
        toast.success("Timer uruchomiony!");
        setSelectedProject("");
        setDescription("");
        router.refresh();
      }
    } catch (error) {
      toast.error("Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!runningTimer) return;

    setLoading(true);
    try {
      const result = await stopTimer(runningTimer.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setRunningTimer(null);
        setElapsedTime(0);
        toast.success("Timer zatrzymany!");
        router.refresh();
      }
    } catch (error) {
      toast.error("Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  // Parse Polish date (dd.mm.rrrr) + time (gg:mm) to ISO string
  const parsePLDateTime = (date: string, time: string): string | null => {
    const d = date.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    const t = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!d || !t) return null;
    const [, day, month, year] = d;
    const [, hours, minutes] = t;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes}`;
  };

  const handleAddManual = async () => {
    if (!selectedProject || !manualStartDate || !manualStartTime || !manualEndDate || !manualEndTime) {
      toast.error("Wypełnij wszystkie pola");
      return;
    }

    const manualStart = parsePLDateTime(manualStartDate, manualStartTime);
    const manualEnd = parsePLDateTime(manualEndDate, manualEndTime);

    if (!manualStart || !manualEnd) {
      toast.error("Nieprawidłowy format daty. Użyj: dd.mm.rrrr i gg:mm");
      return;
    }

    setLoading(true);
    try {
      const result = await addManualTimeEntry(selectedProject, manualStart, manualEnd, description);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Wpis dodany!");
        setAddDialogOpen(false);
        setSelectedProject("");
        setDescription("");
        setManualStartDate("");
        setManualStartTime("");
        setManualEndDate("");
        setManualEndTime("");
        router.refresh();
      }
    } catch (error) {
      toast.error("Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = (entryId: string) => {
    setPendingDeleteId(entryId);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    const entryId = pendingDeleteId;
    setPendingDeleteId(null);

    try {
      const result = await deleteTimeEntry(entryId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Wpis usunięty");
        router.refresh();
      }
    } catch (error) {
      toast.error("Wystąpił błąd");
    }
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Dzisiaj
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatDuration(summary.today)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Ostatnie 7 dni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatDuration(summary.week)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Ostatnie 30 dni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatDuration(summary.month)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer Control */}
      <Card className={runningTimer ? "border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-emerald-600" />
            {runningTimer ? "Timer aktywny" : "Uruchom timer"}
          </CardTitle>
          <CardDescription>
            {runningTimer
              ? `Pracujesz nad: ${runningTimer.project?.name || "Projekt"}`
              : "Wybierz projekt i rozpocznij śledzenie czasu"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {runningTimer ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-mono font-bold text-green-600 dark:text-green-400">
                  {formatElapsedTime(elapsedTime)}
                </div>
                {runningTimer.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {runningTimer.description}
                  </p>
                )}
              </div>
              <Button
                size="lg"
                variant="destructive"
                onClick={handleStopTimer}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                Zatrzymaj
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timer-project">Projekt</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger id="timer-project">
                      <SelectValue placeholder="Wybierz projekt..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timer-description">Opis (opcjonalnie)</Label>
                  <Input
                    id="timer-description"
                    name="timer-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Co robisz..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleStartTimer}
                  disabled={loading || !selectedProject}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Rozpocznij
                </Button>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj ręcznie
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Ostatnie wpisy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak wpisów. Uruchom timer, aby rozpocząć śledzenie czasu.
            </div>
          ) : (
            <div className="space-y-2">
              {timeEntries.filter(e => !e.is_running).slice(0, 20).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.project?.name || "Projekt"}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(entry.duration_minutes || 0)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>
                        {new Date(entry.started_at).toLocaleDateString("pl-PL")}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(entry.started_at).toLocaleTimeString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {" - "}
                        {entry.ended_at && new Date(entry.ended_at).toLocaleTimeString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Manual Entry Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Dodaj wpis ręcznie
            </DialogTitle>
            <DialogDescription>
              Dodaj czas pracy, który nie był śledzony przez timer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manual-project">Projekt *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz projekt..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-start-date">Rozpoczęcie *</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-start-date"
                    name="manual-start-date"
                    type="text"
                    inputMode="numeric"
                    aria-label="Data rozpoczęcia (dd.mm.rrrr)"
                    placeholder="dd.mm.rrrr"
                    value={manualStartDate}
                    onChange={(e) => setManualStartDate(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    id="manual-start-time"
                    name="manual-start-time"
                    type="text"
                    inputMode="numeric"
                    aria-label="Godzina rozpoczęcia (gg:mm)"
                    placeholder="gg:mm"
                    value={manualStartTime}
                    onChange={(e) => setManualStartTime(e.target.value)}
                    className="w-20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-end-date">Zakończenie *</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-end-date"
                    name="manual-end-date"
                    type="text"
                    inputMode="numeric"
                    aria-label="Data zakończenia (dd.mm.rrrr)"
                    placeholder="dd.mm.rrrr"
                    value={manualEndDate}
                    onChange={(e) => setManualEndDate(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    id="manual-end-time"
                    name="manual-end-time"
                    type="text"
                    inputMode="numeric"
                    aria-label="Godzina zakończenia (gg:mm)"
                    placeholder="gg:mm"
                    value={manualEndTime}
                    onChange={(e) => setManualEndTime(e.target.value)}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-description">Opis (opcjonalnie)</Label>
              <Input
                id="manual-description"
                name="manual-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Co robiłeś..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAddManual} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                "Dodaj wpis"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń wpis</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz usunąć ten wpis czasu pracy?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
