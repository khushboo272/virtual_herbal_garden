import mongoose from 'mongoose';
import { NotificationService } from './notification.service';
import Notification from './Notification.model';
import { NotificationType } from '../../types';
import * as socketModule from '../../core/socket';

jest.mock('../../core/socket', () => ({
  getIO: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  }),
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeAll(async () => {
    notificationService = new NotificationService();
    // Connect to test database if needed or mock mongoose (already configured by jest setup)
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification and emit a socket event', async () => {
      const mockCreate = jest.spyOn(Notification, 'create').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        type: NotificationType.SYSTEM_ALERT,
        title: 'Test Notification',
        body: 'Test Body',
      } as any);

      const io = socketModule.getIO();

      await notificationService.createNotification(
        new mongoose.Types.ObjectId().toHexString(),
        NotificationType.SYSTEM_ALERT,
        'Test Notification',
        'Test Body'
      );

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(io.to).toHaveBeenCalled();
      expect(io.emit).toHaveBeenCalledWith('notification:new', expect.any(Object));
    });
  });

  describe('markRead', () => {
    it('should update multiple notifications when ids are provided', async () => {
      const mockUpdateMany = jest.spyOn(Notification, 'updateMany').mockResolvedValueOnce({ modifiedCount: 2 } as any);
      
      const userId = new mongoose.Types.ObjectId().toHexString();
      const id1 = new mongoose.Types.ObjectId().toHexString();
      const id2 = new mongoose.Types.ObjectId().toHexString();

      await notificationService.markRead(userId, [id1, id2]);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { user: userId, _id: { $in: [id1, id2] } },
        { $set: { isRead: true } }
      );
    });

    it('should call markAllRead when ids is "all"', async () => {
      const spyMarkAllRead = jest.spyOn(notificationService, 'markAllRead').mockResolvedValueOnce(undefined);
      
      const userId = new mongoose.Types.ObjectId().toHexString();
      await notificationService.markRead(userId, 'all');

      expect(spyMarkAllRead).toHaveBeenCalledWith(userId);
    });
  });
});
