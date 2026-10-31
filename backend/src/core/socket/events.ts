export const SOCKET_EVENTS = {
  DETECTION_COMPLETE: 'detection:complete',
  NOTIFICATION_NEW: 'notification:new',
  ADMIN_ALERT: 'admin:alert',
  GARDEN_SYNCED: 'garden:synced',
  PLANT_UPDATED: 'plant:updated',
  GARDEN_PLANTS_CHANGED: 'garden:plantsChanged',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
