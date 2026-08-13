import { Bell, Check, Trash2, FileText, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Notification } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface NotificationsDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onOpen: () => void;
  onClearAll: () => void;
  isActive?: boolean;
  /** "bell" = icon-only button (right group); "tab" = text tab style (legacy) */
  triggerVariant?: "bell" | "tab";
}

const NotificationsDropdown = ({
  notifications,
  unreadCount,
  onOpen,
  onClearAll,
  isActive = false,
  triggerVariant = "tab",
}: NotificationsDropdownProps) => {
  const { language, t } = useLanguage();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_created":
        return <FileText className="w-4 h-4 text-[hsl(var(--status-todo))]" />;
      case "task_status_changed":
        return <ArrowRight className="w-4 h-4 text-[hsl(var(--status-progress))]" />;
      case "task_assigned":
        return <Check className="w-4 h-4 text-[hsl(var(--status-approval))]" />;
      default:
        return <Bell className="w-4 h-4 text-cyan-400" />;
    }
  };

  const bellTrigger = (
    <button
      className="relative w-9 h-9 md:w-10 md:h-10 rounded-[10px] bg-[hsl(var(--nav-bg))] border border-[hsl(var(--nav-border))] flex items-center justify-center hover:bg-[hsl(var(--nav-bg-hover))] transition-colors"
      aria-label="Notifications"
    >
      <Bell className="w-4 h-4 text-foreground" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-[10px] text-destructive-foreground font-bold">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );

  const tabTrigger = (
    <button
      className={`relative px-5 py-2 rounded-[7px] text-sm font-medium transition-all tracking-tight ${
        isActive
          ? "bg-[hsl(var(--nav-tab-active))] text-[hsl(var(--nav-tab-active-text))]"
          : "text-[hsl(var(--nav-tab-text))] hover:text-foreground"
      }`}
    >
      {t("nav.notifications")}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-[10px] text-destructive-foreground font-bold">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );

  return (
    <DropdownMenu onOpenChange={(open) => open && onOpen()}>
      <DropdownMenuTrigger asChild>
        {triggerVariant === "bell" ? bellTrigger : tabTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-popover border border-border rounded-xl p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">{t("notifications.title")}</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-7 px-2 text-xs text-muted-foreground hover:bg-accent/50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {t("notifications.clear")}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-accent/50 transition-colors ${
                    !notification.is_read ? "bg-accent/20" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: language === "es" ? es : enUS,
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
