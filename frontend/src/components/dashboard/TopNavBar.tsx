import { useState, useEffect, useRef } from "react";
import { Sun, Moon, FolderPlus, Globe, Check, Bell, Menu, ChevronDown, X, Settings, Cpu, Clock } from "lucide-react";
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
          transition: "all 650ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Project Selector Box */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`
                flex items-center gap-2.5 px-3 py-1.5 rounded-full
                hover:bg-white/[0.08] transition-all duration-500 text-white font-medium text-xs
                focus:outline-none focus:ring-1 focus:ring-cyan-500/40
                ${isNotifActive ? "opacity-40 scale-95" : "opacity-100 scale-100"}
              `}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-white/20 shadow-sm">
                <img
                  src={projectImage}
                  alt={currentProject?.name || "Project"}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="truncate max-w-[140px] font-medium tracking-tight">
                {currentProject?.name || t("nav.selectProject")}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="w-64 p-1.5 bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-white z-[100]"
          >
            <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t("nav.selectProject")}
            </div>
            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer
                    transition-colors duration-150
                    ${currentProject?.id === project.id
                      ? "bg-cyan-500/15 text-cyan-300 font-semibold"
                      : "hover:bg-white/[0.08] text-white/80"
                    }
                  `}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
                    <img
                      src={project.cover_image_url || defaultLogo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="flex-1 truncate">{project.name}</span>
                  {currentProject?.id === project.id && (
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="bg-white/10 my-1" />
            <DropdownMenuItem
              onClick={onNewProject}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{t("nav.newProject")}</span>
            </DropdownMenuItem>
            {isOwner && onProjectSettings && (
              <DropdownMenuItem
                onClick={onProjectSettings}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:bg-white/10 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>{t("nav.settings")}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dynamic Island Notification Banner */}
        {isNotifActive && activeNotif && (
          <div
            onClick={onNotifClick}
            className="flex items-center gap-2.5 px-3.5 py-1.5 cursor-pointer text-xs font-medium text-cyan-300 max-w-[320px] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] animate-fade-in"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <div className="truncate">
              <span className="font-semibold text-white mr-1.5">{activeNotif.title}:</span>
              <span className="opacity-90">{activeNotif.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TopNavBar
// ─────────────────────────────────────────────────────────────────
const TopNavBar = ({
  activeTab,
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
  const [sysUser, setSysUser] = useState("Pedro");
  const [timeStr, setTimeStr] = useState("");
  const [activeIslandNotif, setActiveIslandNotif] = useState<Notification | null>(null);
  const lastNotifIdRef = useRef<string | number | null>(null);

  // Native mode: always owner
  const isOwner = true;

  // Real-time system info & RAM telemetry
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/system_info");
        if (res.ok) {
          const data = await res.json();
          if (data.username) setSysUser(data.username);
          if (data.ram_usage) setRamUsage(data.ram_usage);
        }
      } catch {
        // Fallback
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  // Live clock ticking
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Island gota expansion on new unread notification (5.5s fluid duration)
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.is_read && latest.id !== lastNotifIdRef.current) {
        lastNotifIdRef.current = latest.id;
        setActiveIslandNotif(latest);
        const timer = setTimeout(() => setActiveIslandNotif(null), 5500);
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

        {/* ── Left: User Greeting + Clock + RAM badge ── */}
        <div className="flex items-center gap-3">
          {/* User Greeting & Clock Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] backdrop-blur-md shadow-inner">
            {/* User Greeting - Clean & Premium without status dot */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/90">
              <span className="text-cyan-400 font-medium">{t("header.welcome") || (language === "es" ? "Hola" : "Welcome")},</span>
              <span className="tracking-tight text-white font-bold">{sysUser}</span>
            </div>

            <div className="w-px h-3.5 bg-white/15" />

            {/* Live Clock */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/90">
              <Clock className="w-3.5 h-3.5 text-cyan-400/90" />
              <span className="tracking-wider">{timeStr || "12:00:00"}</span>
            </div>
          </div>

          {/* RAM Telemetry Badge */}
          <div
            id="badge-ollama"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium"
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