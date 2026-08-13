import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  user_id?: string;
  project_id?: string | null;
  task_id?: string | null;
  type: string;
  title: string;
  message: string | null;
  is_read?: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const list: Notification[] = (data.notifications || []).map((n: any) => ({
          ...n,
          is_read: Boolean(n.is_read),
        }));
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
      }
    } catch (error) {
      console.warn("Error fetching notifications from API:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read_all", { method: "POST" });
    } catch (error) {
      console.warn("Error marking notifications read in backend:", error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } catch (error) {
      console.warn("Error clearing notifications from backend:", error);
    } finally {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  const createNotification = useCallback(
    async (
      projectId: string,
      targetUserIds: string[],
      type: string,
      title: string,
      message?: string,
      taskId?: string
    ) => {
      try {
        const res = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            message: message || title,
            type,
            project_id: projectId,
          }),
        });
        if (res.ok) {
          fetchNotifications();
        }
      } catch (error) {
        console.error("Error creating notification:", error);
      }
    },
    [fetchNotifications]
  );

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAllAsRead,
    clearAll,
    createNotification,
    refetch: fetchNotifications,
  };
};
