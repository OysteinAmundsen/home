export type NotificationContentType = 'notification' | 'warning' | 'info';

export interface NotificationContent {
  title: string;
  body: string;
  type: NotificationContentType;
  tag?: string;
}
