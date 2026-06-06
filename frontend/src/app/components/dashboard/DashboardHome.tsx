// ──────────────────────────────────────────────────────────
// Dashboard Home — role-switch component (PRD §3.1)
// Renders the correct dashboard home content based on role.
// This component is ONLY used for the /dashboard index route.
// ──────────────────────────────────────────────────────────

import { useAuth } from '../../../contexts/AuthContext';
import { UserDashboard } from '../slides/UserDashboard';
import { BotanistPanel } from '../slides/BotanistPanel';
import { AdminDashboardOverview } from './pages/AdminDashboardOverview';
import { GuestDashboard } from './GuestDashboard';

interface DashboardHomeProps {
  onOpenSignIn?: () => void;
}

export function DashboardHome({ onOpenSignIn }: DashboardHomeProps) {
  const { user, isAuthenticated, role } = useAuth();

  // Guest / unauthenticated → conversion dashboard
  if (!isAuthenticated || !user) {
    return <GuestDashboard onOpenSignIn={onOpenSignIn || (() => {})} />;
  }

  // Role-based rendering per PRD §3.1
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return <AdminDashboardOverview />;
    case 'BOTANIST':
      return <BotanistPanel />;
    case 'USER':
    default:
      return <UserDashboard user={user} />;
  }
}
