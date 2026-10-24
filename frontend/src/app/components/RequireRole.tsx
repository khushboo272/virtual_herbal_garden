import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

type UserRole = 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';

interface RequireRoleProps {
  minimumRole: UserRole;
  children: React.ReactNode;
  /** Where to redirect unauthenticated users. Default: show login prompt (redirect to /) */
  loginRedirect?: string;
  /** Where to redirect users with insufficient role. Default: /dashboard */
  forbiddenRedirect?: string;
}

/**
 * Route guard component — wraps a route to enforce minimum role.
 * Per PRD §6.2:
 *   - Unauthenticated users → redirect to loginRedirect (default: /)
 *   - Authenticated but insufficient role → redirect to forbiddenRedirect (default: /dashboard) with toast notification
 */
export function RequireRole({
  minimumRole,
  children,
  loginRedirect = '/',
  forbiddenRedirect = '/',
}: RequireRoleProps) {
  const { isAuthenticated, isLoading, hasMinRole } = useAuth();

  const isForbidden = !isLoading && isAuthenticated && !hasMinRole(minimumRole);

  useEffect(() => {
    if (isForbidden) {
      toast.error(`You need ${minimumRole} privileges to access that section.`);
    }
  }, [isForbidden, minimumRole]);

  // Wait for auth state to resolve before deciding
  if (isLoading) return null;

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to={loginRedirect} replace />;
  }

  // Logged in but insufficient role → redirect to forbidden
  if (isForbidden) {
    return <Navigate to={forbiddenRedirect} replace />;
  }

  return <>{children}</>;
}
