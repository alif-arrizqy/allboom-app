import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle, Clock, FileText, Star, MessageSquare, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationService } from "@/services/notification.service";
import type { Notification } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "ASSIGNMENT_CREATED":
      return <FileText className="w-4 h-4 text-primary" />;
    case "SUBMISSION_GRADED":
      return <Star className="w-4 h-4 text-accent" />;
    case "SUBMISSION_REVISION":
      return <CheckCircle className="w-4 h-4 text-green" />;
    case "ASSIGNMENT_DEADLINE":
      return <MessageSquare className="w-4 h-4 text-secondary" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

interface NotificationsProps {
  isTeacher: boolean;
  onClose: () => void;
}

export const Notifications = ({ isTeacher, onClose }: NotificationsProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const [notificationsResponse, unreadResponse] = await Promise.all([
          notificationService.getNotifications({ page: 1, limit: 20 }),
          notificationService.getUnreadCount(),
        ]);

        if (notificationsResponse.success && notificationsResponse.data) {
          const responseData = notificationsResponse.data;
          let notificationsData: Notification[] = [];
          
          // Handle different response structures
          if (Array.isArray(responseData)) {
            notificationsData = responseData;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            // PaginatedResponse structure
            notificationsData = responseData.data;
          } else if (responseData.notifications && Array.isArray(responseData.notifications)) {
            // Backend response structure: { notifications: [...], unreadCount: ... }
            notificationsData = responseData.notifications;
          } else if (responseData.items && Array.isArray(responseData.items)) {
            notificationsData = responseData.items;
          }
          
          setNotifications(notificationsData);
        }

        if (unreadResponse.success && unreadResponse.data) {
          // Handle unread count from different structures
          const unreadData = unreadResponse.data;
          if (typeof unreadData === 'object' && 'count' in unreadData) {
            setUnreadCount(unreadData.count);
          } else if (notificationsResponse.success && notificationsResponse.data) {
            // Try to get from notifications response
            const responseData = notificationsResponse.data;
            if (responseData && typeof responseData === 'object' && 'unreadCount' in responseData) {
              setUnreadCount((responseData as { unreadCount: number }).unreadCount);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-80 md:w-96">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold">Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-80">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Tidak ada notifikasi
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-xl mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.isRead ? "bg-primary/5 border border-primary/10" : ""
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id);
                  }
                  // Always navigate to assignments page since that's where submissions are viewed
                  onClose();
                  navigate("/assignments");
                }}
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border flex gap-2">
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            className="flex-1 text-sm text-primary hover:text-primary"
            onClick={handleMarkAllAsRead}
          >
            Tandai Semua Dibaca
          </Button>
        )}
        <Button variant="ghost" className="flex-1 text-sm text-primary hover:text-primary">
          Lihat Semua
        </Button>
      </div>
    </div>
  );
};

export default Notifications;
