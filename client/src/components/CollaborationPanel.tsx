import React from 'react';
import { Users, Activity, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCollaboration, CollaborativeUser, CollaborationEvent } from '@/hooks/useCollaboration';

interface CollaborationPanelProps {
  diagnosticId: string;
  userId: string;
  userName: string;
}

export function CollaborationPanel({
  diagnosticId,
  userId,
  userName,
}: CollaborationPanelProps) {
  const { isConnected, activeUsers, events } = useCollaboration(
    diagnosticId,
    userId,
    userName
  );

  const otherUsers = activeUsers.filter((u) => u.userId !== userId);

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Users ({activeUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-2 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {user.userName}
                      {user.userId === userId && <span className="text-xs text-muted-foreground"> (You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.joinedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {user.cursor && (
                  <Badge variant="outline" className="text-xs">
                    {user.cursor.x}, {user.cursor.y}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet</p>
            ) : (
              events.slice(-10).reverse().map((event, idx) => (
                <ActivityItem key={idx} event={event} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityItem({ event }: { event: CollaborationEvent }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user-joined':
        return '➕';
      case 'user-left':
        return '➖';
      case 'field-edited':
        return '✏️';
      case 'comment-added':
        return '💬';
      case 'user-timeout':
        return '⏱️';
      default:
        return '•';
    }
  };

  const getActivityText = (event: CollaborationEvent) => {
    switch (event.type) {
      case 'user-joined':
        return `${event.userName} joined`;
      case 'user-left':
        return `${event.userName} left`;
      case 'field-edited':
        return `${event.userName} edited ${event.data?.fieldName}`;
      case 'comment-added':
        return `${event.userName} commented on ${event.data?.fieldName}`;
      case 'user-timeout':
        return `${event.userName} disconnected`;
      default:
        return 'Unknown activity';
    }
  };

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
      <span className="text-base">{getActivityIcon(event.type)}</span>
      <div className="flex-1">
        <p className="text-muted-foreground">{getActivityText(event)}</p>
        <p className="text-xs text-muted-foreground/60">
          {new Date(event.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
