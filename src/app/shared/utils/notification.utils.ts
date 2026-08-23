/**
 * Nhãn + icon cho từng loại thông báo — khớp `Notification::TYPES` phía BE
 * (security | news | event | success | system).
 *
 * Loại lạ (BE thêm type mới mà mini app chưa cập nhật) sẽ rơi về `system` thay vì vỡ giao diện,
 * xem cách dùng ở notification-list/notification-detail component.
 */
export interface NotificationTypeMeta {
  label: string;
  icon: string;
  cls: string;
}

export const NOTIFICATION_TYPE_META: Record<string, NotificationTypeMeta> = {
  security: { label: 'An ninh trật tự', icon: 'fa-solid fa-shield-halved', cls: 'nt-danger' },
  news: { label: 'Tin tức', icon: 'fa-solid fa-newspaper', cls: 'nt-primary' },
  event: { label: 'Sự kiện', icon: 'fa-solid fa-calendar-star', cls: 'nt-warning' },
  success: { label: 'Kết quả', icon: 'fa-solid fa-circle-check', cls: 'nt-success' },
  system: { label: 'Hệ thống', icon: 'fa-solid fa-bell', cls: 'nt-muted' },
};
