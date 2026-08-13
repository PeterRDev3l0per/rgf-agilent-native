import { useState, useEffect, useRef } from "react";
import { Sun, Moon, FolderPlus, Globe, Check, Bell, Menu, ChevronDown, X, Settings, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Project } from "@/hooks/useProjects";
import { Notification } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import NotificationsDropdown from "./NotificationsDropdown";
import defaultLogo from "@/assets/defaultLogo.png";

interface TopNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onProjectSettings?: () => void;
  currentProject: Project | null;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  notifications: Notification[];
  unreadCount: number;
  onNotificationsOpen: () => void;
  onClearNotifications: () => void;
}

const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024);
    };
    checkTablet();
    window.addEventListener("resize", checkTablet);
    return () => window.removeEventListener("resize", checkTablet);
  }, []);
  return isTablet;
};

// ─────────────────────────────────────────────────────────────────
// Dynamic Island Pill — center notch with gota expansion
// ─────────────────────────────────────────────────────────────────
interface DynamicIslandPillProps {
  currentProject: Project | null;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
  isOwner: boolean;
  onProjectSettings?: () => void;
  activeNotif: Notification | null;
  onNotifClick: () => void;
  notifications: Notification[];
  unreadCount: number;
  onNotificationsOpen: () => void;
  onClearNotifications: () => void;
}

const DynamicIslandPill = ({
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  isOwner,
  onProjectSettings,
  activeNotif,
  onNotifClick,
}: DynamicIslandPillProps) => {
  const { t } = useLanguage();
  const projectImage = currentProject?.cover_image_url || defaultLogo;
  const isNotifActive = !!activeNotif;

  return (
    <div
      className="absolute left-1/2 flex items-center pointer-events-none z-10"
      style={{ transform: "translateX(-50%)" }}
    >
      <div
        className={`
          relative flex items-center pointer-events-auto
          bg-[#09090b]/90 border border-white/[0.12] backdrop-blur-2xl
          rounded-full p-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)]
          transition-all duration-500
          ${isNotifActive ? "ring-1 ring-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.4)] border-cyan-500/40" : ""}
        `}
        style={{
          transition: "all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Project Selector Segment — COMPACTS when notification is active */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 px-2.5 py-1 rounded-full hover:bg-white/10 transition-all duration-500 focus:outline-none flex-shrink-0 group overflow-hidden"
              style={{
                maxWidth: isNotifActive ? "36px" : "210px",
                transition: "max-width 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              title={currentProject?.name}
            >
              <div
                className="w-5 h-5 rounded-[5px] overflow-hidden flex-shrink-0 ring-1 ring-white/20"
                onClick={(e) => {
                  if (isOwner && onProjectSettings) {
                    e.stopPropagation();
                    onProjectSettings();
                  }
                }}
              >
                <img src={projectImage} alt="Project" className="w-full h-full object-cover" />
              </div>
              <span
                className={`text-[12px] font-semibold text-white/90 tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  isNotifActive ? "opacity-0 w-0" : "opacity-100"
                }`}
              >
                {currentProject?.name || t("nav.selectProject")}
              </span>
              <ChevronDown className={`w-3 h-3 text-white/40 group-hover:text-white/70 transition-all duration-300 flex-shrink-0 ${
                isNotifActive ? "opacity-0 w-0" : "opacity-100"
              }`} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56 mt-2 bg-[#0d0d11] border border-white/10 backdrop-blur-xl">
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onSelectProject(project)}
                className={currentProject?.id === project.id ? "bg-cyan-500/20 text-cyan-300 font-semibold" : ""}
              >
                <div className="w-5 h-5 rounded overflow-hidden mr-2 flex-shrink-0">
                  <img src={project.cover_image_url || defaultLogo} alt={project.name} className="w-full h-full object-cover" />
                </div>
                <span className="truncate">{project.name}</span>
              </DropdownMenuItem>
            ))}
            {projects.length > 0 && <DropdownMenuSeparator className="bg-white/10" />}
            <DropdownMenuItem onClick={onNewProject}>
              <FolderPlus className="w-4 h-4 mr-2 text-cyan-400" />
              {t("nav.newProject")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notification Segment — EXPANDS on active notification */}
        <div
          className={`flex items-center overflow-hidden transition-all duration-500 ${
            isNotifActive ? "max-w-[280px] opacity-100 ml-1 pr-1" : "max-w-0 opacity-0 ml-0"
          }`}
          style={{
            transition: "max-width 500ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease",
          }}
        >
          <div className="h-4 w-px bg-white/20 mr-2 flex-shrink-0" />
          <button
            onClick={onNotifClick}
            className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none min-w-0 text-left"
          >
            <span className="relative flex-shrink-0">
              <Bell className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-cyan-300 truncate leading-tight whitespace-nowrap">
                {activeNotif?.title}
              </span>
              <span className="text-[10px] text-white/70 truncate leading-tight whitespace-nowrap">
                {activeNotif?.message}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TopNavBar
// ─────────────────────────────────────────────────────────────────
const TopNavBar = ({
  onTabChange,
  onNewTask,
  onNewProject,
  onProjectSettings,
  currentProject,
  projects,
  onSelectProject,
  notifications,
  unreadCount,
  onNotificationsOpen,
  onClearNotifications,
}: TopNavBarProps) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ramUsage, setRamUsage] = useState("<150 MB RAM");
  const [activeIslandNotif, setActiveIslandNotif] = useState<Notification | null>(null);
  const lastNotifIdRef = useRef<string | number | null>(null);

  // Native mode: always owner
  const isOwner = true;

  // Real-time live RAM telemetry fetch
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          if (data.telemetry?.ram_usage) {
            setRamUsage(data.telemetry.ram_usage);
          }
        }
      } catch {
        // Fallback
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Island gota expansion on new unread notification (4s duration)
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.is_read && latest.id !== lastNotifIdRef.current) {
        lastNotifIdRef.current = latest.id;
        setActiveIslandNotif(latest);
        const timer = setTimeout(() => setActiveIslandNotif(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  const handleIslandNotifClick = () => {
    onNotificationsOpen();
    setActiveIslandNotif(null);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-2.5 bg-[#09090b]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="relative flex justify-between items-center h-11 max-w-[1700px] mx-auto">

        {/* ── Left: RAM badge ── */}
        <div className="flex items-center gap-2">
          <div
            id="badge-ollama"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span id="text-ram">{ramUsage}</span>
          </div>
        </div>

        {/* ── Center: Dynamic Island Pill ── */}
        {!isMobile && !isTablet && (
          <DynamicIslandPill
            currentProject={currentProject}
            projects={projects}
            onSelectProject={onSelectProject}
            onNewProject={onNewProject}
            isOwner={isOwner}
            onProjectSettings={onProjectSettings}
            activeNotif={activeIslandNotif}
            onNotifClick={handleIslandNotifClick}
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationsOpen={onNotificationsOpen}
            onClearNotifications={onClearNotifications}
          />
        )}

        {/* Mobile: project selector inline (left) */}
        {(isMobile || isTablet) && (
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0a0a] dark:bg-[#111] border border-white/10 text-white focus:outline-none">
                  <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
                    <img src={currentProject?.cover_image_url || defaultLogo} alt="Project" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-semibold truncate max-w-[100px]">
                    {currentProject?.name || t("nav.selectProject")}
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52">
                {projects.map((project) => (
                  <DropdownMenuItem key={project.id} onClick={() => onSelectProject(project)}>
                    <div className="w-5 h-5 rounded overflow-hidden mr-2">
                      <img src={project.cover_image_url || defaultLogo} alt={project.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate">{project.name}</span>
                  </DropdownMenuItem>
                ))}
                {projects.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={onNewProject}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  {t("nav.newProject")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ── Right: Actions ── */}
        <div id="dynamic-island" className="flex items-center gap-2 md:gap-3">

          {/* Notifications bell (always-accessible) */}
          <NotificationsDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onOpen={onNotificationsOpen}
            onClearAll={onClearNotifications}
            triggerVariant="bell"
          />


          <Button
            id="lbl-new-task"
            onClick={onNewTask}
            className="bg-foreground text-background hover:bg-foreground/90 font-medium gap-2 rounded-[10px] px-4 md:px-8 py-2 md:py-2.5 h-auto text-xs md:text-sm"
            disabled={!currentProject}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {t("nav.newTask")}
          </Button>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 md:w-10 md:h-10 rounded-[10px] bg-[hsl(var(--nav-bg))] border border-[hsl(var(--nav-border))] flex items-center justify-center hover:bg-[hsl(var(--nav-bg-hover))] transition-colors">
                <Settings className="w-4 h-4 text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                {t("settings.languageLabel")}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLanguage("es")} className="flex items-center justify-between">
                <span>{t("settings.spanish")}</span>
                {language === "es" && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")} className="flex items-center justify-between">
                <span>{t("settings.english")}</span>
                {language === "en" && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Sheet Menu */}
          {(isMobile || isTablet) && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-[10px] bg-[hsl(var(--nav-bg))] border border-[hsl(var(--nav-border))]">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[260px] p-4 bg-background">
                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => { onTabChange("Home"); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent"
                  >
                    {t("nav.home")}
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;