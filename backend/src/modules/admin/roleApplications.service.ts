import { Types } from 'mongoose';
import RoleApplication, { RoleApplicationStatus } from './RoleApplication.model';
import User from '../users/User.model';
import Plant from '../library/Plant.model';
import Remedy from '../remedies/Remedy.model';
import Detection from '../ai-scanner/Detection.model';
import { UserRole, NotificationType } from '../../types';
import { AppError } from '../../core/errors/AppError';
import { writeAuditLog } from '../../core/utils/auditLogger';
import { notificationService } from '../notifications/notification.service';
import { adminUsersService } from './adminUsers.service';

export interface SubmitRoleApplicationDto {
  motivation: string;
  qualifications: string;
  links?: string[];
}

export class RoleApplicationsService {
  /**
   * Submit an application to become a BOTANIST
   */
  async submitApplication(userId: string, data: SubmitRoleApplicationDto, _req?: any) {
    if (!Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    if (user.role === UserRole.BOTANIST || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw new AppError('You already have botanist or administrator privileges', 400);
    }

    const pending = await RoleApplication.findOne({
      userId,
      status: RoleApplicationStatus.PENDING,
    });
    if (pending) {
      throw new AppError('You already have a pending application under review', 400, 'APPLICATION_PENDING');
    }

    if (!data.motivation || data.motivation.trim().length < 50) {
      throw new AppError('Motivation must be at least 50 characters long', 400);
    }

    if (!data.qualifications || data.qualifications.trim().length < 10) {
      throw new AppError('Please detail your qualifications (minimum 10 characters)', 400);
    }

    const cleanLinks = Array.isArray(data.links)
      ? data.links.map((l) => String(l).trim()).filter(Boolean).slice(0, 3)
      : [];

    const application = await RoleApplication.create({
      userId: user._id,
      requestedRole: UserRole.BOTANIST,
      motivation: data.motivation.trim(),
      qualifications: data.qualifications.trim(),
      links: cleanLinks,
      status: RoleApplicationStatus.PENDING,
    });

    return application;
  }

  /**
   * Get the current user's latest application status
   */
  async getMyApplication(userId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);

    return RoleApplication.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * List applications for admin review
   */
  async listApplications(status?: string, page = 1, limit = 20) {
    const pageNum = Math.max(1, parseInt(String(page || 1), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || 20), 10)));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const [applications, total] = await Promise.all([
      RoleApplication.find(query)
        .sort({ createdAt: status === RoleApplicationStatus.PENDING ? 1 : -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name displayName email avatar role createdAt')
        .populate('reviewerId', 'name displayName email avatar')
        .lean(),
      RoleApplication.countDocuments(query),
    ]);

    // Enhance applicant items with account age and activity counts
    const enhanced = await Promise.all(
      applications.map(async (app: any) => {
        const u = app.userId;
        let applicantStats = {
          accountAgeDays: 0,
          contributionsCount: 0,
          scansCount: 0,
        };

        if (u && u._id) {
          const accountAgeDays = Math.max(
            0,
            Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          );

          const [plantCount, remedyCount, scansCount] = await Promise.all([
            Plant.countDocuments({ createdBy: u._id, isDeleted: { $ne: true } }),
            Remedy.countDocuments({ createdBy: u._id, isDeleted: { $ne: true } }),
            Detection.countDocuments({ user: u._id }),
          ]);

          applicantStats = {
            accountAgeDays,
            contributionsCount: plantCount + remedyCount,
            scansCount,
          };
        }

        return {
          ...app,
          applicantStats,
        };
      }),
    );

    return {
      items: enhanced,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Approve application and grant BOTANIST role
   */
  async approveApplication(id: string, reviewer: any, note?: string, req?: any) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid application ID', 400);

    const application = await RoleApplication.findById(id);
    if (!application) throw new AppError('Role application not found', 404);

    if (application.status !== RoleApplicationStatus.PENDING) {
      if (application.status === RoleApplicationStatus.APPROVED) {
        return application;
      }
      throw new AppError(`Application is already ${application.status.toLowerCase()}`, 400);
    }

    // Apply the role using adminUsersService (enforces role policy, audits, invalidates refresh tokens, notifies)
    await adminUsersService.updateUserRole(
      application.userId.toString(),
      UserRole.BOTANIST,
      reviewer,
      req,
    );

    application.status = RoleApplicationStatus.APPROVED;
    application.reviewerId = reviewer._id;
    application.reviewNote = note || 'Your application to become a Botanist has been approved!';
    application.reviewedAt = new Date();
    await application.save();

    await writeAuditLog({
      actor: reviewer._id,
      action: 'ROLE_APPLICATION_APPROVED',
      targetModel: 'RoleApplication',
      targetId: application._id,
      details: {
        applicantId: application.userId,
        grantedRole: UserRole.BOTANIST,
        note: application.reviewNote,
      },
      req,
    });

    return application;
  }

  /**
   * Reject application with required reason
   */
  async rejectApplication(id: string, reviewer: any, reason: string, req?: any) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid application ID', 400);

    if (!reason || !reason.trim()) {
      throw new AppError('A rejection reason is required to give feedback to the applicant', 400);
    }

    const application = await RoleApplication.findById(id);
    if (!application) throw new AppError('Role application not found', 404);

    if (application.status !== RoleApplicationStatus.PENDING) {
      throw new AppError(`Application is already ${application.status.toLowerCase()}`, 400);
    }

    application.status = RoleApplicationStatus.REJECTED;
    application.reviewerId = reviewer._id;
    application.reviewNote = reason.trim();
    application.reviewedAt = new Date();
    await application.save();

    // Send notification to applicant
    await notificationService.createNotification(
      application.userId.toString(),
      NotificationType.SYSTEM,
      'Botanist Application Status',
      `Your application to become a Botanist was reviewed: ${reason.trim()}`,
      '/dashboard/become-contributor',
    );

    await writeAuditLog({
      actor: reviewer._id,
      action: 'ROLE_APPLICATION_REJECTED',
      targetModel: 'RoleApplication',
      targetId: application._id,
      details: {
        applicantId: application.userId,
        reason: reason.trim(),
      },
      req,
    });

    return application;
  }
}

export const roleApplicationsService = new RoleApplicationsService();
