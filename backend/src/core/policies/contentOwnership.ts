import { AppError } from '../utils/apiResponse';
import { UserRole, ROLE_HIERARCHY, ContentStatus } from '../../types';

export interface OwnableContent {
  _id?: unknown;
  owner?: unknown;
  createdBy?: unknown;
  status?: string;
  isPublished?: boolean;
}

/**
 * Asserts that the authenticated user has permission to edit, update, delete, or upload assets
 * for a plant or remedy item.
 *
 * Rules:
 * 1. ADMIN+ (hierarchy >= 3) has full access regardless of owner or status.
 * 2. BOTANIST:
 *    - Must be the owner (item.owner === userId or item.createdBy === userId).
 *    - Status must be mutable: DRAFT, CHANGES_REQUESTED, or REJECTED.
 *    - PENDING_REVIEW and PUBLISHED are locked for BOTANIST.
 * 3. Others (USER / GUEST) have no write access.
 */
export function assertCanModifyContent(
  item: OwnableContent,
  userId: string,
  userRole: UserRole | string,
  action: 'update' | 'delete' | 'upload' = 'update',
): void {
  const roleHierarchy = ROLE_HIERARCHY[userRole as UserRole] ?? 0;

  // Admin and Super Admin can edit any content in any state
  if (roleHierarchy >= ROLE_HIERARCHY[UserRole.ADMIN]) {
    return;
  }

  // Non-botanists cannot modify contributor content
  if (roleHierarchy < ROLE_HIERARCHY[UserRole.BOTANIST]) {
    throw new AppError('Insufficient permissions to modify content', 403, 'FORBIDDEN');
  }

  // Verify ownership
  const ownerId = item.owner?.toString() || item.createdBy?.toString();
  if (!ownerId || ownerId !== userId) {
    throw new AppError('You can only modify your own contributions', 403, 'FORBIDDEN');
  }

  // Verify status is editable
  const currentStatus = item.status || (item.isPublished ? ContentStatus.PUBLISHED : ContentStatus.DRAFT);
  const editableStatuses: string[] = [
    ContentStatus.DRAFT,
    ContentStatus.CHANGES_REQUESTED,
    ContentStatus.REJECTED,
  ];

  if (!editableStatuses.includes(currentStatus)) {
    if (currentStatus === ContentStatus.PENDING_REVIEW) {
      throw new AppError(
        'This item is currently under review and cannot be modified. Withdraw it first if you need to make changes.',
        403,
        'CONTENT_LOCKED_PENDING_REVIEW',
      );
    }
    if (currentStatus === ContentStatus.PUBLISHED) {
      throw new AppError(
        'Published content cannot be edited directly. Please submit a correction request instead.',
        403,
        'CONTENT_LOCKED_PUBLISHED',
      );
    }
    throw new AppError(`Cannot ${action} content in ${currentStatus} status`, 403, 'CONTENT_LOCKED');
  }
}
