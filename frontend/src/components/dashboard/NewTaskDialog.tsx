import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import RichTextEditor, { RichTextEditorRef } from "@/components/editor/RichTextEditor";
import { useProjectTags } from "@/hooks/useProjectTags";
import { useLanguage } from "@/contexts/LanguageContext";
import { getHomologatedTag } from "@/utils/tagColors";
import { ChevronRight, CornerDownLeft, Circle, ChevronDown, Tag, Users, Eye, Plus, CalendarIcon, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import defaultLogo from "@/assets/defaultLogo.png";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: { 
    title: string; 
    description: string; 
    status: string; 
    priority: string;
    tagIds: string[];
    assigneeIds: string[];
    dueDate: Date | null;
  }) => void;
  defaultStatus?: string;
  project: {
    id: string;
    name: string;
  } | null;
}

const colorPresets = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
];

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

const NewTaskDialog = ({ open, onOpenChange, onSubmit, defaultStatus = "todo", project }: NewTaskDialogProps) => {
  const { language, t } = useLanguage();
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState("medium");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const statusOptions = [
    { value: "todo", label: t("status.todo") },
    { value: "inprogress", label: "En Proceso" },
    { value: "client_approval", label: t("status.client_approval") },
    { value: "done", label: t("status.done") },
  ];
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  
  const { tags, createTag, updateTagColor } = useProjectTags(project?.id || null);
  // Native mode: single user
  const members = [{
    user_id: "user-pedro",
    role: "owner" as const,
    profile: { display_name: "Pedro", full_name: "Pedro (Agilent Native)", avatar_url: null, avatar_color: "#3b82f6" },
  }];

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setTitleError(false);
      setDescription("");
      setDescriptionExpanded(false);
      setStatus(defaultStatus);
      setPriority("medium");
      setSelectedTagIds([]);
      setSelectedAssigneeIds([]);
      setNewTagName("");
      setDueDate(null);
      // Focus title input
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [open, defaultStatus]);

  const expandAndFocusDescription = () => {
    setDescriptionExpanded(true);
    // Wait for animation/render then focus editor
    setTimeout(() => {
      editorRef.current?.focus();
    }, 50);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      titleInputRef.current?.focus();
      return;
    }
    onSubmit({ 
      title, 
      description, 
      status, 
      priority,
      tagIds: selectedTagIds,
      assigneeIds: selectedAssigneeIds,
      dueDate,
    });
    onOpenChange(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && !e.shiftKey) {
      // TAB from title expands and focuses description
      e.preventDefault();
      expandAndFocusDescription();
    } else if (e.key === "Enter" && !e.shiftKey) {
      // Enter submits if description is collapsed
      if (!descriptionExpanded) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && e.shiftKey) {
      // Shift+TAB from description returns to title
      e.preventDefault();
      titleInputRef.current?.focus();
    }
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

  const getDisplayName = (member: InternalMember) => {
    return member.profile?.display_name || member.profile?.full_name || "User";
  };

  const chipBaseClass = "rounded-[7px] border dark:border-[#303030] border-[#D0D0D0] dark:bg-[#1B1B1B] bg-background px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-accent/10 transition-colors text-sm flex-shrink-0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="modal-create-task" className="w-[95vw] max-w-[640px] p-0 gap-0 border border-border/50 bg-popover rounded-2xl shadow-2xl overflow-hidden [&>button]:hidden max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header Breadcrumb */}
          <div className="flex items-center gap-2 px-6 pt-6 pb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border dark:border-[#303030] border-[#D0D0D0] dark:bg-[#1B1B1B] bg-background">
              <img 
                src={project?.cover_image_url || defaultLogo} 
                alt="" 
                className="w-4 h-4 rounded-full object-cover" 
              />
              <span className="font-medium text-foreground">{project?.name || "Project"}</span>
            </div>
            <ChevronRight className="w-4 h-4" />
            <span>New Task</span>
          </div>

          {/* Title Input (Invisible Field) */}
          <div className="px-6 pb-2">
            <input
              id="create-title"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError(false);
              }}
              onKeyDown={handleTitleKeyDown}
              placeholder="Issue Title"
              className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground text-foreground"
            />
            {titleError && (
              <span className="text-sm text-destructive mt-1 block">Title is required</span>
            )}
          </div>

          {/* Description Textarea */}
          <div className="px-6 pb-4">
            <textarea
              id="create-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task details..."
              rows={3}
              className="w-full text-sm bg-muted/20 border border-border/40 rounded-lg p-3 outline-none text-foreground resize-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Task Settings Chips Row */}
          <div className="px-6 pb-4 flex flex-wrap gap-2 overflow-x-auto scrollbar-none"
               style={{ maxWidth: "100%" }}>
            {/* Status Chip */}
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={chipBaseClass}>
                  <span>{statusOptions.find((s) => s.value === status)?.label || "Todo"}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors",
                      status === option.value && "bg-accent/20"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Priority Semaphore Chip */}
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={cn(chipBaseClass, getPrioritySemaphoreStyle(priority).bg, "font-medium")}>
                  {getPrioritySemaphoreStyle(priority).icon}
                  <span className="capitalize">{t(`priority.${priority}`)}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1 bg-popover border border-border" align="start">
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

            {/* Assignee Chip */}
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={chipBaseClass}>
                  <Users className="w-4 h-4 opacity-70" />
                  <span>
                    {selectedAssigneeIds.length > 0
                      ? `${selectedAssigneeIds.length} Assignee${selectedAssigneeIds.length > 1 ? "s" : ""}`
                      : "Assignee"}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="text-xs text-muted-foreground mb-2 px-1">Internal team members only</div>
                {members.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2 px-1">No team members found</div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {members.map((member) => (
                      <button
                        key={member.user_id}
                        type="button"
                        onClick={() => toggleAssignee(member.user_id)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/10 transition-colors"
                      >
                        <Checkbox
                          checked={selectedAssigneeIds.includes(member.user_id)}
                          className="pointer-events-none"
                        />
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: member.profile?.avatar_color || "#3b82f6" }}
                        >
                          {(member.profile?.display_name || member.profile?.full_name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm truncate">{getDisplayName(member)}</span>
                        <span className="text-xs text-muted-foreground ml-auto capitalize">{member.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Due Date Chip */}
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={chipBaseClass}>
                  <CalendarIcon className="w-4 h-4 opacity-70" />
                  <span>
                    {dueDate ? format(dueDate, "MMM d, yyyy") : "No due date"}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
                      className="w-full text-muted-foreground hover:text-destructive"
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Topic Chip */}
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={chipBaseClass}>
                  <Tag className="w-4 h-4 opacity-70" />
                  <span>
                    {selectedTagIds.length > 0
                      ? `${selectedTagIds.length} ${t("task.topic")}`
                      : t("task.topic")}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
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
                    placeholder={language === "es" ? "Agregar Tópico..." : "Add Topic..."}
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
                  {tags.map((tag) => {
                    const hTag = getHomologatedTag(tag.name, language);
                    return (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-accent/10 transition-colors"
                      >
                        <Checkbox
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={() => toggleTag(tag.id)}
                        />
                        <div
                          className="w-3 h-3 rounded-full shrink-0 border"
                          style={{ backgroundColor: hTag.bgColor, borderColor: hTag.borderColor }}
                        />
                        <span
                          className="text-sm cursor-pointer flex-1"
                          style={{ color: hTag.textColor }}
                          onClick={() => toggleTag(tag.id)}
                        >
                          {hTag.name}
                        </span>
                      </div>
                    );
                  })}
                  {tags.length === 0 && (
                    <div className="text-sm text-muted-foreground py-2">No tags yet. Create one above.</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit Button */}
          <div className="px-6 pb-6">
            <Button
              type="submit"
              disabled={!title.trim()}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-[7px] font-medium flex items-center justify-center gap-2"
            >
              Guardar Tarea
              <CornerDownLeft className="w-4 h-4 opacity-70" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTaskDialog;
