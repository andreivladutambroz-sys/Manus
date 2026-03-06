// @ts-nocheck
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

export function NotificationCenter() {
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery();
  const [isOpen, setIsOpen] = useState(false);
  const markAsRead = trpc.notifications.markAsRead.useMutation();

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead.mutateAsync({ notificationId });
      refetch();
    } catch (error) {
      toast.error("Eroare la marcarea notificării");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "analysis_complete":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "diagnostic_saved":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "system_alert":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Notificări</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-slate-600">Se încarcă...</div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-2 p-2">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-3 cursor-pointer hover:bg-slate-50 transition ${
                      !notification.isRead ? "bg-blue-50 border-blue-200" : ""
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(notification.createdAt).toLocaleTimeString("ro-RO")}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-600">
                Nu aveți notificări
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
