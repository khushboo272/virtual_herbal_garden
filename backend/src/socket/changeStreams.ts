import mongoose from 'mongoose';
import { getIO } from './index';
import { SOCKET_EVENTS } from './events';
import { logger } from '../utils/logger';

export function initializeChangeStreams(): void {
  const db = mongoose.connection;

  // Watch detections for status changes → push to user
  const detectionStream = db.collection('detections').watch(
    [{ $match: { 'updateDescription.updatedFields.status': 'COMPLETE' } }],
    { fullDocument: 'updateLookup' },
  );

  detectionStream.on('change', (change) => {
    if (change.operationType === 'update' && change.fullDocument) {
      const doc = change.fullDocument;
      const userId = doc.user?.toString();
      if (userId) {
        getIO().to(`user:${userId}`).emit(SOCKET_EVENTS.DETECTION_COMPLETE, {
          detectionId: doc._id,
          status: doc.status,
          topMatch: doc.topMatch,
          predictions: doc.predictions,
        });
      }
    }
  });

  // Watch notifications for new inserts → push to user
  const notificationStream = db.collection('notifications').watch(
    [{ $match: { operationType: 'insert' } }],
    { fullDocument: 'updateLookup' },
  );

  notificationStream.on('change', (change) => {
    if (change.operationType === 'insert' && change.fullDocument) {
      const doc = change.fullDocument;
      const userId = doc.user?.toString();
      if (userId) {
        getIO().to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, {
          id: doc._id, type: doc.type, title: doc.title, body: doc.body,
        });
      }
    }
  });

  // Watch reviews for flagged → alert admins
  const reviewStream = db.collection('reviews').watch(
    [{ $match: { 'updateDescription.updatedFields.isFlagged': true } }],
    { fullDocument: 'updateLookup' },
  );

  reviewStream.on('change', (change) => {
    if ('fullDocument' in change && change.fullDocument) {
      getIO().to('admin').emit(SOCKET_EVENTS.ADMIN_ALERT, {
        type: 'flagged_review',
        reviewId: change.fullDocument._id,
        plantId: change.fullDocument.plant,
      });
    }
  });

  const handleStreamError = (err: any) => {
    logger.warn('Change Stream error (likely no replica set): ' + err.message);
  };

  detectionStream.on('error', handleStreamError);
  notificationStream.on('error', handleStreamError);
  reviewStream.on('error', handleStreamError);

  logger.info('✅ MongoDB Change Streams initialized (or bypassed if no replica set)');
}
