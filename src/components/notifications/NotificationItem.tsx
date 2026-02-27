import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Trophy, BarChart, AlertCircle, Target,
  Flame, Bell
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle, Trophy, BarChart, AlertCircle, Target, Flame, Bell,
};

const colorMap: Record<string, string> = {
  success: 'border-l-green-500 dark:border-l-green-400',
  info: 'border-l-blue-500 dark:border-l-blue-400',
  warning: 'border-l-yellow-500 dark:border-l-yellow-400',
  error: 'border-l-red-500 dark:border-l-red-400',
};

const iconColorMap: Record<string, string> = {
  success: 'text-green-500 dark:text-green-400',
  info: 'text-blue-500 dark:text-blue-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  error: 'text-red-500 dark:text-red-400',
};

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    message: string;
    icon: string | null;
    color: string | null;
    action_url: string | null;
    is_read: boolean;
    created_at: string;
  };
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  const navigate = useNavigate();
  const Icon = iconMap[notification.icon || ''] || Bell;
  const borderColor = colorMap[notification.color || 'info'] || colorMap.info;
  const iconColor = iconColorMap[notification.color || 'info'] || iconColorMap.info;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left px-3 py-2.5 border-l-3 transition-colors hover:bg-muted/50 flex items-start gap-2.5',
        borderColor,
        !notification.is_read && 'bg-primary/5'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-sm', !notification.is_read ? 'font-semibold' : 'font-medium')}>
            {notification.title}
          </span>
          {!notification.is_read && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <span className="text-[10px] text-muted-foreground/70 mt-1 block">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
};

export default NotificationItem;
