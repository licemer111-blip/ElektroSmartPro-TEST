"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useModalStore } from "@/hooks/use-modal-store";
import { createProject } from "@/app/dashboard/actions";
import { getTemplates, createProjectFromTemplate, type ProjectTemplate } from "@/app/dashboard/templates/actions";
import { StepBasicInfo } from "@/components/modals/_parts/StepBasicInfo";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      disabled={pending} 
      className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
      size="lg"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          Finalizowanie...
        </span>
      ) : (
        "Utwórz projekt"
      )}
    </Button>
  );
}

export function CreateProjectModal() {
  const { isOpen, type, data, onClose } = useModalStore();
  const [error, setError] = useState<string | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<string>("");
  const [selectedVatRate, setSelectedVatRate] = useState<number>(23);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isModalOpen = isOpen && type === "createProject";

  // Extract data from modal store
  const objectTypes = data.objectTypes || [];
  const currentProjectCount = data.currentProjectCount || 0;
  const isPro = data.isPro || false;
  const maxProjects = data.maxProjects || 3;

  // Check if user hit project limit
  const isAtLimit = !isPro && currentProjectCount >= maxProjects;

  // Fetch templates when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setIsLoadingTemplates(true);
      getTemplates()
        .then(setTemplates)
        .catch(console.error)
        .finally(() => setIsLoadingTemplates(false));
    }
  }, [isModalOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setSelectedObjectType("");
      setSelectedVatRate(23);
      setSelectedTemplate("");
      setError(null);
    }
  }, [isModalOpen]);

  // Handle creating project from template
  const handleCreateFromTemplate = async (templateId: string, projectName: string) => {
    if (!projectName.trim()) {
      setError("Podaj nazwę projektu");
      return;
    }
    
    setIsCreatingFromTemplate(true);
    setError(null);
    
    try {
      const result = await createProjectFromTemplate(templateId, projectName);
      
      if (result.error) {
        setError(result.error);
      } else if (result.projectId) {
        toast({
          title: "Projekt utworzony z szablonu!",
          description: "Przekierowywanie do projektu...",
        });
        onClose();
        router.push(`/dashboard/projects/${result.projectId}`);
      }
    } catch (err) {
      setError("Wystąpił błąd podczas tworzenia projektu");
    } finally {
      setIsCreatingFromTemplate(false);
    }
  };

  async function handleSubmit(formData: FormData) {
    setError(null);
    
    const projectName = formData.get("name") as string;
    
    // If template is selected, create from template instead
    if (selectedTemplate && selectedTemplate !== "none") {
      await handleCreateFromTemplate(selectedTemplate, projectName);
      return;
    }

    // Validate all required fields BEFORE submission
    if (!selectedObjectType || selectedObjectType.trim() === "") {
      setError("Wybierz typ obiektu z listy rozwijanej");
      return;
    }

    formData.set("object_type_id", selectedObjectType.trim());
    formData.set("vat_rate", selectedVatRate.toString());

    const result = await createProject(formData);

    if (result?.error) {
      // ⚠️ DEMO MODE CHECK - Show upgrade prompt
      if ((result as { requiresUpgrade?: boolean }).requiresUpgrade) {
        toast({
          title: "Osiągnięto limit projektów",
          description: result.error,
          variant: "destructive",
        });
        setError(result.error);
        return;
      }
      
      // Enhanced error messages
      let displayError = result.error;
      
      // Handle specific error cases
      if (result.error.includes("row-level security") || result.error.includes("42501")) {
        displayError = "Błąd uprawnień. Sprawdź polityki RLS w bazie danych.";
      } else if (result.error.includes("Nieprawidłowe województwo lub typ obiektu")) {
        displayError = "Wybierz prawidłowe województwo i typ obiektu z list rozwijanych.";
      } else if (result.error.includes("foreign key")) {
        displayError = "Wybrane opcje nie istnieją w bazie danych. Sprawdź dane referencyjne.";
      }
      
      setError(displayError);
      
      // Also show toast for critical errors
      if (displayError.includes("RLS") || displayError.includes("uprawnień")) {
        toast({
          title: "Błąd konfiguracji",
          description: "Skontaktuj się z administratorem systemu",
          variant: "destructive",
        });
      }
    } else if (result?.success && result?.project) {
      // ✅ SUCCESS - Redirect to the new project!
      const projectId = result.project.id;

      // Check for pending redirect (e.g. Szybka Wycena requested project creation first)
      const postRedirect = typeof window !== "undefined"
        ? sessionStorage.getItem("postCreateRedirect")
        : null;
      if (postRedirect) {
        sessionStorage.removeItem("postCreateRedirect");
      }

      // Save as last project
      if (typeof window !== "undefined") {
        localStorage.setItem("lastProjectId", projectId);
      }

      toast({
        title: "Projekt utworzony!",
        description: postRedirect ? "Przekierowywanie do Szybkiej Wyceny..." : "Przekierowywanie do edycji projektu...",
      });
      
      onClose();
      
      // Reset form
      setSelectedObjectType("");
      setSelectedVatRate(23);
      setError(null);
      
      // 🚀 REDIRECT: post-create target or new project page
      router.push(postRedirect ?? `/dashboard/projects/${projectId}`);
    } else {
      setError("Wystąpił nieoczekiwany błąd. Projekt mógł zostać utworzony.");
    }
  }

  // If at limit, show upgrade prompt instead
  if (isAtLimit && isModalOpen) {
    return (
      <Dialog open={isModalOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Osiągnięto limit projektów</DialogTitle>
            <DialogDescription>
              Twoje konto Demo pozwala na {maxProjects} aktywnych projektów.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
              <p className="font-medium mb-2">🔒 Limit projektów</p>
              <p className="text-xs">
                Aby tworzyć nielimitowaną liczbę projektów, przejdź na plan PRO.
              </p>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/dashboard/subscription">
                Przejdź na PRO (159 zł/mies.)
              </Link>
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Anuluj
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Nowy projekt
          </DialogTitle>
          <DialogDescription>
            Wypełnij dane projektu kosztorysowego
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-3">
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Basic info, template, object type, client data — _parts/StepBasicInfo */}
          <StepBasicInfo
            templates={templates}
            isLoadingTemplates={isLoadingTemplates}
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
            selectedObjectType={selectedObjectType}
            onObjectTypeChange={setSelectedObjectType}
            objectTypes={objectTypes}
            hasError={!!error}
          />

          {/* Submit */}
          <div className="pt-2">
            {isCreatingFromTemplate ? (
              <Button type="button" disabled className="w-full bg-blue-600 text-white" size="lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tworzenie z szablonu...
              </Button>
            ) : (
              <SubmitButton />
            )}
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Po utworzeniu dodasz pozycje z katalogu i wygenerujesz PDF
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
