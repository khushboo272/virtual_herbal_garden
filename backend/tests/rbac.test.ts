/**
 * Unit tests for the requireRole RBAC middleware.
 * Per PRD §10: "Unit tests for authorize() middleware covering all role levels."
 *
 * These tests run in-process with mock Express req/res — no DB required.
 */
import { Request, Response, NextFunction } from 'express';
import { requireRole } from '../src/core/middleware/rbac';
import { UserRole, ROLE_HIERARCHY } from '../src/types';

// ── Helpers ──

function mockReq(role?: UserRole): Partial<Request> {
  if (!role) return {}; // no user (unauthenticated)
  return {
    user: { sub: 'user123', email: 'test@test.com', role } as any,
  };
}

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── Tests ──

describe('requireRole middleware', () => {
  const allRoles: UserRole[] = [
    UserRole.GUEST,
    UserRole.USER,
    UserRole.BOTANIST,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ];

  describe('Role hierarchy constants', () => {
    it('should define exactly 5 roles in ROLE_HIERARCHY', () => {
      expect(Object.keys(ROLE_HIERARCHY)).toHaveLength(5);
    });

    it('should have correct hierarchy order: GUEST < USER < BOTANIST < ADMIN < SUPER_ADMIN', () => {
      expect(ROLE_HIERARCHY[UserRole.GUEST]).toBe(0);
      expect(ROLE_HIERARCHY[UserRole.USER]).toBe(1);
      expect(ROLE_HIERARCHY[UserRole.BOTANIST]).toBe(2);
      expect(ROLE_HIERARCHY[UserRole.ADMIN]).toBe(3);
      expect(ROLE_HIERARCHY[UserRole.SUPER_ADMIN]).toBe(4);
    });
  });

  describe('Unauthenticated requests (no req.user)', () => {
    it('should return 401 when req.user is missing', () => {
      const req = mockReq(); // no user
      const res = mockRes();
      const next = jest.fn();
      const middleware = requireRole(UserRole.USER);

      middleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Hierarchical role enforcement', () => {
    // For each minimum role, test all 5 user roles
    allRoles.forEach((minimumRole) => {
      allRoles.forEach((userRole) => {
        const shouldPass = ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
        const expectation = shouldPass ? 'ALLOW' : 'DENY';

        it(`requireRole(${minimumRole}) + user.role=${userRole} → ${expectation}`, () => {
          const req = mockReq(userRole);
          const res = mockRes();
          const next = jest.fn();
          const middleware = requireRole(minimumRole);

          middleware(req as Request, res as Response, next as NextFunction);

          if (shouldPass) {
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
          } else {
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: 'FORBIDDEN' }),
              }),
            );
          }
        });
      });
    });
  });

  describe('Specific PRD route guard patterns', () => {
    it('USER can create reviews (requireRole(USER))', () => {
      const req = mockReq(UserRole.USER);
      const res = mockRes();
      const next = jest.fn();
      requireRole(UserRole.USER)(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('BOTANIST can create plants (requireRole(BOTANIST))', () => {
      const req = mockReq(UserRole.BOTANIST);
      const res = mockRes();
      const next = jest.fn();
      requireRole(UserRole.BOTANIST)(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('USER cannot create plants (requireRole(BOTANIST))', () => {
      const req = mockReq(UserRole.USER);
      const res = mockRes();
      const next = jest.fn();
      requireRole(UserRole.BOTANIST)(req as Request, res as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('ADMIN can publish plants (requireRole(ADMIN))', () => {
      const req = mockReq(UserRole.ADMIN);
      const res = mockRes();
      const next = jest.fn();
      requireRole(UserRole.ADMIN)(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('BOTANIST cannot publish plants (requireRole(ADMIN))', () => {
      const req = mockReq(UserRole.BOTANIST);
      const res = mockRes();
      const next = jest.fn();
      requireRole(UserRole.ADMIN)(req as Request, res as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('SUPER_ADMIN can change user roles (requireRole(SUPER_ADMIN))', () => {
      const req = mockReq(UserRole.SUPER_ADMIN);
      const res = mockRes();
      const next = jest.fn();
      requireRole(UserRole.SUPER_ADMIN)(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('ADMIN cannot change user roles (requireRole(SUPER_ADMIN))', () => {
      const req = mockReq(UserRole.ADMIN);
      const res = mockRes();
      const next = jest.fn();
      requireRole(UserRole.SUPER_ADMIN)(req as Request, res as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
