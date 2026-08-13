import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Task } from "./TaskCard";
import { Project } from "@/hooks/useProjects";
import { X, Search, Plus, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface CommandPaletteProps {
  tasks: Task[];
  currentProject: Project | null;
  onNewTask: () => void;
  onNewProject: () => void;
  onTaskClick: (task: Task) => void;
}

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

const MAX_TASK_RESULTS = 25;
const DEBOUNCE_MS = 150;

// Animation constants
const STAGGER_DELAY = 15; // ms per item
const MAX_STAGGER_ITEMS = 6;

const fuzzyMatch = (query: string, task: Task): boolean => {
  const q = query.toLowerCase();
  if (task.title.toLowerCase().includes(q)) return true;
  if (String(task.taskNumber).toLowerCase().includes(q)) return true;
  if (task.tags.some(tag => tag.name.toLowerCase().includes(q))) return true;
  if (task.assignees.some(a => a.name.toLowerCase().includes(q))) return true;
  return false;
};

const CommandPalette = ({
  tasks,
  currentProject,
  onNewTask,
  onNewProject,
  onTaskClick,
}: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [listKey, setListKey] = useState(0); // For re-triggering list animations
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  const { theme } = useTheme();
  const isLightMode = theme === "light";
  
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  
  // Detect platform for shortcut hint
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcutHint = isMac ? "⌘K" : "Ctrl K";
  const powerShortcutHint = isMac ? "⌘↵" : "Ctrl ↵";
  
  // Define actions
  const actions: ActionItem[] = useMemo(() => [
    {
      id: "create-task",
      label: "Create New Task",
      icon: <Plus className="w-4 h-4" />,
      action: onNewTask,
    },
    {
      id: "create-project",
      label: "Create New Project",
      icon: <FolderPlus className="w-4 h-4" />,
      action: onNewProject,
    },
  ], [onNewTask, onNewProject]);
  
  // Filter actions based on query
  const visibleActions = useMemo(() => {
    if (!debouncedQuery.trim()) return actions;
    const q = debouncedQuery.toLowerCase();
    return actions.filter(action => action.label.toLowerCase().includes(q));
  }, [actions, debouncedQuery]);
  
  // Filter tasks based on query
  const filteredTasks = useMemo(() => {
    if (!debouncedQuery.trim() || !currentProject) return [];
    return tasks
      .filter(task => fuzzyMatch(debouncedQuery, task))
      .slice(0, MAX_TASK_RESULTS);
  }, [debouncedQuery, tasks, currentProject]);
  
  // Combined items for navigation
  const allItems = useMemo(() => {
    const items: Array<{ type: "action" | "task"; data: ActionItem | Task }> = [];
    
    visibleActions.forEach(action => {
      items.push({ type: "action", data: action });
    });
    
    filteredTasks.forEach(task => {
      items.push({ type: "task", data: task });
    });
    
    return items;
  }, [visibleActions, filteredTasks]);
  
  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      // Trigger list animation on query change
      setListKey(prev => prev + 1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);
  
  // Reset selection when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allItems.length]);
  
  // Reset query and selection when project changes while open
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
    }
  }, [currentProject?.id]);
  
  // Close handler with focus restoration and exit animation
  const handleClose = useCallback(() => {
    if (prefersReducedMotion) {
      setOpen(false);
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => {
        previousFocusRef.current?.focus();
        previousFocusRef.current = null;
      });
      return;
    }
    
    // Start exit animation
    setIsAnimatingOut(true);
    
    // Wait for animation to complete before unmounting
    setTimeout(() => {
      setOpen(false);
      setIsAnimatingOut(false);
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
      
      // Restore focus to previously focused element
      requestAnimationFrame(() => {
        previousFocusRef.current?.focus();
        previousFocusRef.current = null;
      });
    }, 150);
  }, [prefersReducedMotion]);
  
  // Select item handler
  const handleSelect = useCallback((index: number) => {
    const item = allItems[index];
    if (!item) return;
    if (item.type === "action") {
      const action = item.data as ActionItem;
      handleClose();
      action.action();
    } else {
      const task = item.data as Task;
      handleClose();
      onTaskClick(task);
    }
  }, [allItems, handleClose, onTaskClick]);
  
  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input, textarea, or contenteditable (unless it's our own input)
      const target = e.target as HTMLElement;
      const isOurInput = target === inputRef.current;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');
      
      // Open shortcut: Cmd+K or Ctrl+K (only when not editing other fields)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        // Always prevent default to stop browser's native search
        e.preventDefault();
        e.stopPropagation();
        
        if (!isEditing) {
          previousFocusRef.current = document.activeElement as HTMLElement;
          setOpen(true);
          setListKey(prev => prev + 1); // Reset list animations
        }
      }
      
      // Power shortcut: Cmd+Enter or Ctrl+Enter (only when palette is open)
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && open) {
        e.preventDefault();
        handleClose();
        onNewTask();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [open, handleClose, onNewTask]);
  
  // Keyboard navigation inside palette
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        handleSelect(selectedIndex);
        break;
      case "Escape":
        e.preventDefault();
        handleClose();
        break;
    }
  };
  
  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);
  
  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);
  
  // Status label mapping
  const getStatusLabel = (status: Task["status"]) => {
    switch (status) {
      case "todo": return "Todo";
      case "inprogress": return "In Progress";
      case "client_approval": return "Client Approval";
      case "done": return "Done";
      default: return status;
    }
  };
  
  // Calculate stagger delay for list items
  const getStaggerDelay = (index: number) => {
    if (prefersReducedMotion) return 0;
    return Math.min(index, MAX_STAGGER_ITEMS) * STAGGER_DELAY;
  };
  
  let itemIndex = 0;
  
  // Theme-aware background colors for actions/tasks
  const getItemBg = (isSelected: boolean, disabled?: boolean) => {
    if (disabled) {
      return isLightMode 
        ? "bg-[#E5E5E5]/60 border-transparent" 
        : "bg-[#2D2D2D]/40 border-transparent";
    }
    if (isSelected) {
      return isLightMode 
        ? "bg-[#E5E5E5] border-[#BABABA]" 
        : "bg-[#2D2D2D] border-[#9E9E9E]";
    }
    return isLightMode 
      ? "bg-[#F0F0F0]/60 border-transparent hover:bg-[#E5E5E5]/80" 
      : "bg-[#2D2D2D]/40 border-transparent hover:bg-[#2D2D2D]/60";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => o ? setOpen(true) : handleClose()}>
      <DialogContent
        className={cn(
          "w-[95vw] max-w-[560px] p-0 gap-0 border-0 bg-transparent shadow-none overflow-hidden [&>button]:hidden",
          // Animation classes
          !prefersReducedMotion && "data-[state=open]:animate-none data-[state=closed]:animate-none"
        )}
        aria-label="Command palette"
        aria-keyshortcuts="Control+k Meta+k"
      >
        {/* 3D Perspective Container */}
        <div
          className="relative"
          style={{
            perspective: "1500px",
            perspectiveOrigin: "50% 100%",
          }}
        >
          {/* Main container with column-like styling + 3D animation */}
          <div
            className={cn(
              "relative overflow-hidden rounded-[12px]",
              // 3D Entry/exit animations
              !prefersReducedMotion && !isAnimatingOut && "animate-[commandPalette3DIn_160ms_cubic-bezier(0.2,0.8,0.2,1)]",
              !prefersReducedMotion && isAnimatingOut && "animate-[commandPalette3DOut_140ms_cubic-bezier(0.4,0,1,1)]"
            )}
            style={{
              transformStyle: "preserve-3d",
              background: isLightMode 
                ? `linear-gradient(17deg, rgba(200, 220, 200, 0.4) 0%, rgba(180, 220, 180, 0.2) 12.8%, rgba(150, 180, 150, 0.00) 35%), hsl(var(--column-base))`
                : `linear-gradient(17deg, rgba(230, 240, 231, 0.35) 0%, rgba(116, 253, 132, 0.14) 12.8%, rgba(66, 135, 91, 0.00) 35%), hsl(var(--column-base))`,
              boxShadow: isLightMode 
                ? "0 25px 50px -12px rgba(0,0,0,0.15)"
                : "var(--column-shadow-light)",
            }}
          >
            {/* Gradient stroke overlay */}
            <div
              className="absolute inset-0 rounded-[12px] pointer-events-none"
              style={{
                padding: "1px",
                background: isLightMode
                  ? "linear-gradient(145deg, hsl(var(--column-stroke-1) / 0.3) 0%, hsl(var(--column-stroke-2) / 0.7) 40%, hsl(var(--column-stroke-2) / 0.5) 70%)"
                  : "linear-gradient(145deg, hsl(var(--column-stroke-1) / 0) 0%, hsl(var(--column-stroke-2) / 0.58) 40%, hsl(var(--column-stroke-2) / 0.58) 70%)",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            
            {/* Search Input Row */}
            <div className="relative z-10 flex items-center gap-3 px-4 py-3">
              <Search className="w-5 h-5 opacity-40 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a command or search…"
                className={cn(
                  "flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm",
                  // Focus ring animation
                  !prefersReducedMotion && "transition-[box-shadow] duration-[120ms]"
                )}
              />
              <span className="text-xs text-muted-foreground/40 font-medium hidden sm:block">
                {shortcutHint}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-md hover:bg-accent/20 transition-colors duration-100"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-border mx-4" />
            
            {/* Content */}
            <div
              ref={listRef}
              key={listKey}
              className="relative z-10 p-2 max-h-[400px] overflow-y-auto scrollbar-none"
            >
              {!currentProject ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Select a project to search tasks.
                </div>
              ) : (
                <>
                  {/* Actions Section */}
                  {visibleActions.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </span>
                        <span className="text-[11px] text-muted-foreground/40">
                          {powerShortcutHint} New Task
                        </span>
                      </div>
                      <div className="flex flex-col gap-4">
                        {visibleActions.map((action, idx) => {
                          const currentIndex = itemIndex++;
                          const isSelected = selectedIndex === currentIndex;
                          const staggerDelay = getStaggerDelay(idx);
                          
                          const button = (
                            <button
                              key={action.id}
                              type="button"
                              data-index={currentIndex}
                              onClick={() => handleSelect(currentIndex)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-[8px] text-sm border",
                                "transition-all duration-100 ease-out",
                                getItemBg(isSelected),
                                !prefersReducedMotion && "animate-[listItemIn_140ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]",
                                !prefersReducedMotion && "opacity-0"
                              )}
                              style={{
                                animationDelay: prefersReducedMotion ? "0ms" : `${staggerDelay}ms`,
                              }}
                            >
                              <span className="w-[18px] h-[18px] flex items-center justify-center opacity-70 text-foreground">
                                {action.icon}
                              </span>
                              <span className="text-foreground">{action.label}</span>
                            </button>
                          );

                          return button;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Tasks Section */}
                  {debouncedQuery.trim() && (
                    <div>
                      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tasks
                      </div>
                      {filteredTasks.length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground text-sm">
                          No tasks found
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {filteredTasks.map((task, idx) => {
                            const currentIndex = itemIndex++;
                            const isSelected = selectedIndex === currentIndex;
                            // Start stagger after actions
                            const staggerDelay = getStaggerDelay(visibleActions.length + idx);
                            
                            return (
                              <button
                                key={task.id}
                                type="button"
                                data-index={currentIndex}
                                onClick={() => handleSelect(currentIndex)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-3 rounded-[8px] text-left border",
                                  // Smooth selection transition
                                  "transition-all duration-100 ease-out",
                                  getItemBg(isSelected),
                                  // Entry animation
                                  !prefersReducedMotion && "animate-[listItemIn_140ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]",
                                  !prefersReducedMotion && "opacity-0"
                                )}
                                style={{
                                  animationDelay: prefersReducedMotion ? "0ms" : `${staggerDelay}ms`,
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-foreground truncate">
                                    {task.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <span>{task.taskNumber}</span>
                                    <span>•</span>
                                    <span>{getStatusLabel(task.status)}</span>
                                    {task.tags.length > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{task.tags[0].name}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Assignee initials */}
                                {task.assignees.length > 0 && (
                                  <div className="flex -space-x-1.5">
                                    {task.assignees.slice(0, 2).map((assignee) => {
                                      const initials = assignee.name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
                                      return (
                                        <div
                                          key={assignee.id}
                                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-background"
                                          style={{ backgroundColor: assignee.avatarColor || "#3b82f6" }}
                                          title={assignee.name}
                                        >
                                          {initials}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            
          </div>
        </div>
      </DialogContent>

      {/* CSS Animations - injected as style tag */}
      <style>{`
        @keyframes commandPalette3DIn {
          from {
            opacity: 0;
            transform: translateY(30px) rotateX(-15deg) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) rotateX(0deg) scale(1);
          }
        }
        
        @keyframes commandPalette3DOut {
          from {
            opacity: 1;
            transform: translateY(0) rotateX(0deg) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(30px) rotateX(-15deg) scale(0.95);
          }
        }
        
        @keyframes listItemIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          @keyframes commandPalette3DIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes commandPalette3DOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes listItemIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </Dialog>
  );
};

export default CommandPalette;