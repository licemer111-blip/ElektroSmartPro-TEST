"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  getTags,
  createTag,
  addTagToProject,
  removeTagFromProject,
  getProjectTags,
  type ProjectTag,
} from "@/app/dashboard/projects/tags-actions";
import { Tag, Plus, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

// Predefined tag colors
const TAG_COLORS = [
  { name: "Czerwony", value: "#ef4444" },
  { name: "Pomarańczowy", value: "#f97316" },
  { name: "Żółty", value: "#eab308" },
  { name: "Zielony", value: "#22c55e" },
  { name: "Niebieski", value: "#3b82f6" },
  { name: "Fioletowy", value: "#a855f7" },
  { name: "Różowy", value: "#ec4899" },
];

interface ProjectTagsManagerProps {
  projectId: string;
  compact?: boolean;
}

export function ProjectTagsManager({ projectId, compact = false }: ProjectTagsManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<ProjectTag[]>([]);
  const [projectTags, setProjectTags] = useState<ProjectTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [creating, setCreating] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const [all, assigned] = await Promise.all([
        getTags(),
        getProjectTags(projectId),
      ]);
      setAllTags(all);
      setProjectTags(assigned);
    } catch {
      // ignore fetch error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open, projectId]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setCreating(true);
    try {
      const result = await createTag(newTagName, newTagColor);
      if (result.error) {
        toast.error(result.error);
      } else if (result.tag) {
        setAllTags([...allTags, result.tag]);
        setNewTagName("");
        toast.success("Tag utworzony!");
      }
    } catch (error) {
      toast.error("Błąd podczas tworzenia tagu");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleTag = async (tag: ProjectTag) => {
    const isAssigned = projectTags.some(t => t.id === tag.id);
    
    try {
      if (isAssigned) {
        const result = await removeTagFromProject(projectId, tag.id);
        if (result.error) {
          toast.error(result.error);
        } else {
          setProjectTags(projectTags.filter(t => t.id !== tag.id));
        }
      } else {
        const result = await addTagToProject(projectId, tag.id);
        if (result.error) {
          toast.error(result.error);
        } else {
          setProjectTags([...projectTags, tag]);
        }
      }
    } catch (error) {
      toast.error("Błąd");
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Display assigned tags */}
      {projectTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-xs cursor-pointer hover:opacity-80"
          style={{ 
            backgroundColor: `${tag.color}20`,
            borderColor: tag.color,
            color: tag.color,
          }}
          onClick={() => handleToggleTag(tag)}
        >
          {tag.name}
          <X className="w-3 h-3 ml-1" />
        </Badge>
      ))}

      {/* Add tag button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={compact ? "h-6 px-2" : "h-7 px-2"}
          >
            <Tag className="w-3 h-3 mr-1" />
            {!compact && <span className="text-xs">Tagi</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="space-y-3">
            <div className="font-medium text-sm">Zarządzaj tagami</div>
            
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <>
                {/* Available tags */}
                <div className="space-y-1">
                  {allTags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Brak tagów. Utwórz pierwszy poniżej.
                    </p>
                  ) : (
                    allTags.map((tag) => {
                      const isAssigned = projectTags.some(t => t.id === tag.id);
                      return (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          onClick={() => handleToggleTag(tag)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm">{tag.name}</span>
                          </div>
                          {isAssigned && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Create new tag */}
                <div className="border-t pt-3 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Nowy tag
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="new-tag-name"
                      name="new-tag-name"
                      aria-label="Nazwa nowego tagu"
                      placeholder="Nazwa tagu..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                    />
                    <Button
                      size="sm"
                      className="h-8 px-2"
                      onClick={handleCreateTag}
                      disabled={creating || !newTagName.trim()}
                    >
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {/* Color picker */}
                  <div className="flex gap-1">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color.value}
                        className={`w-5 h-5 rounded-full border-2 ${
                          newTagColor === color.value
                            ? "border-slate-900 dark:border-white"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setNewTagColor(color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
