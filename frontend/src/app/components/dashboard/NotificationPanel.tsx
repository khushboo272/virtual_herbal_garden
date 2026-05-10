import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Bell, Check, CheckCircle2, FileText, AlertCircle, RefreshCw, UserCog, Sparkles, Activity } from 'lucide-react';
import { useNotifications, Notification } from '../../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { NotificationType } from '../../../lib/types';
import { cn } from '../ui/utils';
import { ReactNode } from 'react';

const getNotificationIcon = (type: NotificationType): ReactNode => {
  switch (type) {
    case NotificationType.CONTRIBUTION_PUBLISHED:
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case NotificationType.CONTRIBUTION_REJECTED:
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case NotificationType.CONTRIBUTION_CHANGES_REQUESTED:
      return <RefreshCw className="w-5 h-5 text-amber-500" />;
    case NotificationType.NEW_SUBMISSION:
      return <FileText className="w-5 h-5 text-blue-500" />;
    case NotificationType.ROLE_CHANGED:
      return <UserCog className="w-5 h-5 text-purple-500" />;
    case NotificationType.ACCOUNT_SUSPENDED:
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    case NotificationType.SCAN_COMPLETE:
      return <Sparkles className="w-5 h-5 text-indigo-500" />;
    case NotificationType.SYSTEM_ALERT:
      return <Activity className="w-5 h-5 text-orange-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

export function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-green-700 hover:bg-green-50">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] px-1 py-0 min-w-[16px] h-4">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-gray-100 bg-slate-50 flex flex-row items-center justify-between">
          <SheetTitle className="text-lg font-semibold text-gray-800">Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()} className="h-8 text-xs">
              Mark All Read
            </Button>
          )}
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-6 text-center text-gray-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <Bell className="w-12 h-12 mb-4 text-gray-300 opacity-50" />
              <p>You have no notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={cn(
                    "p-4 hover:bg-slate-50 transition-colors flex gap-4 cursor-pointer relative",
                    !notification.isRead && "bg-blue-50/30"
                  )}
                  onClick={() => {
                    if (!notification.isRead) markAsRead([notification._id]);
                    if (notification.actionUrl) window.location.href = notification.actionUrl;
                  }}
                >
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />
                  )}
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm mb-1", !notification.isRead ? "font-medium text-gray-900" : "text-gray-700")}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">{notification.body}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-200 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead([notification._id]);
                      }}
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-gray-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
