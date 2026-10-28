import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationPanel } from '../NotificationPanel';
import * as useNotificationsModule from '../../../../hooks/useNotifications';

vi.mock('../../../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
  NotificationType: {
    SYSTEM: 'SYSTEM',
    ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  },
}));

describe('NotificationPanel Component', () => {
  it('safely renders without crashing when notification has invalid or missing createdAt', () => {
    vi.mocked(useNotificationsModule.useNotifications).mockReturnValue({
      notifications: [
        {
          _id: 'notif-1',
          user: 'user-1',
          type: 'SYSTEM' as any,
          title: 'Account Suspended',
          body: 'Your account has been suspended by an administrator: test',
          isRead: false,
          createdAt: 'invalid-date-string',
        },
        {
          _id: 'notif-2',
          user: 'user-1',
          type: 'SYSTEM' as any,
          title: 'System Alert',
          body: 'Welcome to the garden',
          isRead: true,
          createdAt: undefined as any,
        },
      ],
      unreadCount: 1,
      loading: false,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      refresh: vi.fn(),
    });

    // Before fix, this throws RangeError: Invalid time value
    expect(() => render(<NotificationPanel />)).not.toThrow();
  });
});
