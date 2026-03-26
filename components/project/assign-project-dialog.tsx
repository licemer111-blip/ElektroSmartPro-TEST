"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { assignProject } from "@/app/dashboard/projects/[id]/actions";
import { getProjectMembers } from "@/app/dashboard/projects/[id]/members-actions";
import { UserCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ProjectMemberWithProfile } from "@/lib/types/database";

interface AssignProjectDialogProps {
  projectId: string;
  currentAssignedTo?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: () => void;
}

export function AssignProjectDialog({
  projectId,
  currentAssignedTo,
  open,
  onOpenChange,
  onAssigned,
}: AssignProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [members, setMembers] = useState<ProjectMemberWithProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentAssignedTo || "none");

  useEffect(() => {
    if (open) {
      setLoadingMembers(true);
      getProjectMembers(projectId)
        .then((data) => {
          // Filter only active members
          const activeMembers = data.filter(m => m.status === "active");
          setMembers(activeMembers);
        })
        .catch(() => { /* ignore load error */ })
        .finally(() => setLoadingMembers(false));
      
      setSelectedUserId(currentAssignedTo || "none");
    }
  }, [open, projectId, currentAssignedTo]);

  const handleAssign = async () => {
    setLoading(true);
    try {
      const userId = selectedUserId === "none" ? null : selectedUserId;
      const result = await assignProject(projectId, userId);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(userId ? "Projekt został przypisany!" : "Przypisanie zostało usunięte");
        onOpenChange(false);
        onAssigned?.();
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas przypisywania projektu");
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (member: ProjectMemberWithProfile) => {
    if (member.profiles?.full_name) return member.profiles.full_name;
    if (member.profiles?.email) return member.profiles.email;
    return "Użytkownik";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner": return "👑 Właściciel";
      case "editor": return "✏️ Edytor";
      case "viewer": return "👁️ Widz";
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-600" />
            Przypisz projekt
          </DialogTitle>
          <DialogDescription>
            Przypisz ten projekt do członka zespołu. Przypisana osoba będzie 
            odpowiedzialna za realizację projektu.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="assign-to">Przypisz do</Label>
            
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Ładowanie członków...
              </div>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="assign-to">
                  <SelectValue placeholder="Wybierz osobę..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    ❌ Brak przypisania
                  </SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {getMemberName(member)} ({getRoleBadge(member.role)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {members.length === 0 && !loadingMembers && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Brak członków w projekcie. Najpierw zaproś kogoś do zespołu.
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleAssign} disabled={loading || loadingMembers}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Zapisz"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
