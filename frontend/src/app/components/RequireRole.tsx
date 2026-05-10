import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type UserRole = 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';

interface RequireRoleProps {
  minimumRole: UserRole;
  children: React.ReactNode;
  /** Where to redirect unauthenticated users. Default: show login prompt (redirect to /) */
  loginRedirect?: string;
  /** Where to redirect users with insufficient role. Default: / */
  forbiddenRedirect?: string;
}

/**
 * Route guard component — wraps a route to enforce minimum role.
 * Per PRD §6.2:
 *   - Unauthenticated users → redirect to loginRedirect (default: /)
 *   - Authenticated but insufficient role → redirect to forbiddenRedirect (default: /)
 */
export function RequireRole({
  minimumRole,
  children,
  loginRedirect = '/',
  forbiddenRedirect = '/',
}: RequireRoleProps) {
  const { isAuthenticated, isLoading, hasMinRole } = useAuth();

  // Wait for auth state to resolve before deciding
  if (isLoading) return null;

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to={loginRedirect} replace />;
  }

  // Logged in but insufficient role → redirect to forbidden
  if (!hasMinRole(minimumRole)) {
    return <Navigate to={forbiddenRedirect} replace />;
  }

  return <>{children}</>;
}
