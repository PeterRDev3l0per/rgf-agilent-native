import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import RichTextEditor, { RichTextEditorRef } from "@/components/editor/RichTextEditor";
import { useProjectTags } from "@/hooks/useProjectTags";
import { Task } from "./TaskCard";
import { ChevronRight, CornerDownLeft, ChevronDown, Tag, Users, Plus, Trash2, CalendarIcon, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import defaultLogo from "@/assets/defaultLogo.png";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onUpdate?: (taskId: string, updates: {
    title: string;
    description: string;
    priority: string;
    tagIds: string[];
    assigneeIds: string[];
    dueDate: Date | null;
  }) => void;
  onDelete?: (taskId: string) => void;
  isReadOnly?: boolean;
  project?: {
    id: string;
    name: string;
  } | null;
}

const colorPresets = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
];

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Semaphore traffic light styles for priority (Bajo = Yellow, Medio = Amber, Alto = Red)
const getPrioritySemaphoreStyle = (priority: string) => {
  const p = (priority || "medium").toLowerCase();
  if (p === "high" || p === "alta" || p === "alto") {
    return {
      bg: "bg-red-500/15 border-red-500/30 text-red-500 dark:text-red-400",
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      dot: "bg-red-500",
    };
  }
  if (p === "low" || p === "baja" || p === "bajo") {
    return {
      bg: "bg-sky-500/15 border-sky-500/30 text-sky-500 dark:text-sky-400",
      icon: <CheckCircle2 className="w-4 h-4 text-sky-400" />,
      dot: "bg-sky-400",
    };
  }
  // Medium / Amber
  return {
    bg: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    dot: "bg-amber-500",
  };
};

const TaskDetailsDialog = ({ 
  open, 
  onOpenChange, 
  task, 
  onUpdate, 
  onDelete, 
  isReadOnly = false,
  project 
}: TaskDetailsDialogProps) => {
  const { language, t } = useLanguage();
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(["user-pedro"]);
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  
  const { tags, createTag, updateTagColor } = useProjectTags(project?.id || task?.project_id || null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTitleError(false);
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setSelectedTagIds(task.tags?.map((t) => t.id).filter(Boolean) as string[] || []);
      setSelectedAssigneeIds(task.assignees?.map((a) => a.id) || ["user-pedro"]);
      setShowDeleteConfirm(false);
      
      if (task.dueDate && task.dueDate !== "No due date" && task.dueDate !== "Sin fecha de entrega" && task.dueDate !== "Sin fecha") {
        try {
          const parsed = parseISO(task.dueDate);
          if (!isNaN(parsed.getTime())) {
            setDueDate(parsed);
          } else {
            setDueDate(null);
          }
        } catch {
          setDueDate(null);
        }
      } else {
        setDueDate(null);
      }
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError(true);
      titleInputRef.current?.focus();
      return;
    }
    onUpdate?.(task.id, { 
      title, 
      description, 
      priority,
      tagIds: selectedTagIds,
      assigneeIds: selectedAssigneeIds,
      dueDate,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete?.(task.id);
    onOpenChange(false);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const newTag = await createTag(newTagName.trim(), colorPresets[Math.floor(Math.random() * colorPresets.length)]);
    if (newTag) {
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      setNewTagName("");
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const chipBaseClass = "rounded-[7px] border px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors text-sm flex-shrink-0";

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const activeSemaphore = getPrioritySemaphoreStyle(priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="modal-task-detail" className="w-[95vw] max-w-[640px] p-0 gap-0 border border-border/50 bg-popover rounded-2xl shadow-2xl overflow-hidden [&>button]:hidden max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col">
          {/* Header Breadcrumb */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                <img 
                  src={project?.cover_image_url || defaultLogo} 
                  alt="" 
                  className="w-4 h-4 rounded-full object-cover" 
                />
                <span className="font-medium text-foreground">{project?.name || "Project"}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
              <span>#{task.taskNumber || 1}</span>
            </div>
          </div>

          {/* Title Input */}
          <div className="px-6 pb-2">
            {isReadOnly ? (
              <p className="text-lg font-medium text-foreground">{title}</p>
            ) : (
              <>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError(false);
                  }}
                  placeholder={t("task.titlePlaceholder")}
                  className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground text-foreground"
                />
                {titleError && (
                  <span className="text-sm text-destructive mt-1 block">El título es requerido</span>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <div className="px-6 pb-4">
            {isReadOnly ? (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 max-h-[280px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: description || `<p class='text-muted-foreground'>${t("task.noDescription")}</p>` }}
              />
            ) : (
              <div className="min-h-[140px]">
                <RichTextEditor
                  ref={editorRef}
                  content={description}
                  onChange={setDescription}
                  placeholder={t("task.descriptionPlaceholder")}
                />
              </div>
            )}
          </div>

          {/* Task Settings Chips Row */}
          <div className="px-6 pb-4 flex flex-wrap gap-2">
            {/* Priority Semaphore Chip */}
            {isReadOnly ? (
              <div className={cn(chipBaseClass, activeSemaphore.bg, "cursor-default font-medium")}>
                {activeSemaphore.icon}
                <span className="capitalize">{t(`priority.${priority}`)}</span>
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={cn(chipBaseClass, activeSemaphore.bg, "font-medium")}>
                    {activeSemaphore.icon}
                    <span className="capitalize">{t(`priority.${priority}`)}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-1 bg-popover border border-border" align="start">
                  {[
                    { key: "low", labelKey: "priority.low" },
                    { key: "medium", labelKey: "priority.medium" },
                    { key: "high", labelKey: "priority.high" },
                  ].map((item) => {
                    const style = getPrioritySemaphoreStyle(item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPriority(item.key)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 font-medium mb-1",
                          style.bg,
                          priority === item.key && "ring-1 ring-foreground/20 font-bold"
                        )}
                      >
                        {style.icon}
                        <span className="capitalize">{t(item.labelKey)}</span>
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            )}

            {/* Assignee Chip */}
            {isReadOnly ? (
              <div className={cn(chipBaseClass, "border-border bg-background cursor-default")}>
                <Users className="w-4 h-4 opacity-70" />
                <span>
                  {selectedAssigneeIds.length > 0
                    ? `1 ${t("task.assignee")} (pedro)`
                    : t("task.noAssignee")}
                </span>
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={cn(chipBaseClass, "border-border bg-background")}>
                    <Users className="w-4 h-4 opacity-70" />
                    <span>
                      {selectedAssigneeIds.length > 0
                        ? `1 ${t("task.assignee")} (pedro)`
                        : t("task.assignee")}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 bg-popover border border-border" align="start">
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => toggleAssignee("user-pedro")}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/10 transition-colors"
                    >
                      <Checkbox
                        checked={selectedAssigneeIds.includes("user-pedro")}
                        className="pointer-events-none"
                      />
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: "#3b82f6" }}
                      >
                        PE
                      </div>
                      <span className="text-sm truncate">Pedro (Host Engineer)</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Due Date Chip */}
            {isReadOnly ? (
              <div className={cn(chipBaseClass, "border-border bg-background cursor-default")}>
                <CalendarIcon className="w-4 h-4 opacity-70" />
                <span>{dueDate ? format(dueDate, "dd/MM/yyyy") : t("task.noDueDate")}</span>
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={cn(chipBaseClass, "border-border bg-background")}>
                    <CalendarIcon className="w-4 h-4 opacity-70" />
                    <span>
                      {dueDate ? format(dueDate, "dd/MM/yyyy") : t("task.noDueDate")}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate || undefined}
                    onSelect={(date) => setDueDate(date || null)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                  {dueDate && (
                    <div className="px-3 pb-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDueDate(null)}
                        className="w-full text-muted-foreground hover:text-destructive text-xs"
                      >
                        {t("common.clear")}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Tags Chip */}
            {isReadOnly ? (
              selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => {
                    const rgb = hexToRgb(tag.color);
                    const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : "rgba(2, 132, 199, 0.15)";
                    return (
                      <span
                        key={tag.id}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold"
                        style={{ backgroundColor: bgColor, color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={cn(chipBaseClass, "border-border bg-background")}>
                    <Tag className="w-4 h-4 opacity-70" />
                    <span>
                      {selectedTagIds.length > 0
                        ? `${selectedTagIds.length} ${t("task.tags")}`
                        : t("task.tags")}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 bg-popover border border-border" align="start">
                  {/* Create new tag input */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateTag();
                        }
                      }}
                      placeholder="Crear tag..."
                      className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
                    />
                    {newTagName.trim() && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCreateTag}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Tags list */}
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-accent/10 transition-colors"
                      >
                        <Checkbox
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={() => toggleTag(tag.id)}
                        />
                        <Popover open={editingTagId === tag.id} onOpenChange={(open) => setEditingTagId(open ? tag.id : null)}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="w-3 h-3 rounded-full shrink-0 hover:ring-2 ring-offset-1 ring-offset-background ring-foreground/20 transition-all"
                              style={{ backgroundColor: tag.color }}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2 bg-popover border border-border" align="start">
                            <div className="grid grid-cols-4 gap-1">
                              {colorPresets.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => {
                                    updateTagColor(tag.id, color);
                                    setEditingTagId(null);
                                  }}
                                  className={cn(
                                    "w-6 h-6 rounded-full hover:scale-110 transition-transform",
                                    tag.color === color && "ring-2 ring-offset-1 ring-foreground"
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <span
                          className="text-sm cursor-pointer flex-1"
                          onClick={() => toggleTag(tag.id)}
                        >
                          {tag.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Selected Tags Display */}
          {!isReadOnly && selectedTags.length > 0 && (
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {selectedTags.map((tag) => {
                const rgb = hexToRgb(tag.color);
                const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : "rgba(2, 132, 199, 0.15)";
                return (
                  <span
                    key={tag.id}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold"
                    style={{ backgroundColor: bgColor, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-6 pb-6 space-y-3">
            {isReadOnly ? (
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-[7px] font-medium"
              >
                {t("common.close")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-[7px] font-medium flex items-center justify-center gap-2"
                >
                  {t("task.saveChanges")}
                  <CornerDownLeft className="w-4 h-4 opacity-70" />
                </Button>
                {showDeleteConfirm ? (
                  <div className="w-full flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        onDelete?.(task.id);
                        setShowDeleteConfirm(false);
                        onOpenChange(false);
                      }}
                      className="flex-1 h-10 rounded-[7px] text-xs font-semibold"
                    >
                      Confirmar borrado
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="h-10 rounded-[7px] text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full h-10 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-[7px] font-medium flex items-center justify-center gap-2 text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("task.deleteTask")}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
