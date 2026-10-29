import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  ShieldAlert,
  RefreshCw,
  LogIn,
  Sparkles,
  Lock,
  Leaf,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../app/components/ui/dialog';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { IMaintenanceStatus } from '../types/featureFlag.types';

interface MaintenanceScreenProps {
  status: IMaintenanceStatus;
  onRefresh: () => void;
}

export function MaintenanceScreen({ status, onRefresh }: MaintenanceScreenProps) {
  const { login, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  // Admin login modal state
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Live countdown calculation
  useEffect(() => {
    if (!status.reopenAt) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
      return;
    }

    const calculateTime = () => {
      const target = new Date(status.reopenAt!).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [status.reopenAt]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const result = await login(adminEmail, adminPassword);
      if (result.requires2fa) {
        setLoginError('2FA challenge required. Please log in via the regular portal with 2FA.');
        setIsLoggingIn(false);
        return;
      }

      // Check current user role against allowedRoles
      const allowed = status.allowedRoles && status.allowedRoles.length > 0
        ? status.allowedRoles
        : ['SUPER_ADMIN', 'ADMIN'];

      const meRes = await api.get<{ role: string }>('/users/me').catch(() => null);
      if (meRes?.data?.role && !allowed.includes(meRes.data.role as any)) {
        await logout();
        setLoginError(
          meRes.data.role === 'ADMIN'
            ? 'Platform maintenance mode is active. Administrator access is currently restricted to Super Admins only.'
            : 'Platform is currently undergoing scheduled maintenance. Public access is paused.'
        );
        setIsLoggingIn(false);
        return;
      }

      setIsAdminLoginOpen(false);
      onRefresh();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    await onRefresh();
    setTimeout(() => setIsChecking(false), 600);
  };

  const reopenFormatted = status.reopenAt
    ? new Date(status.reopenAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden select-none">
      {/* Background ambient decorative blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Brand */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-lg">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-emerald-100">
              Virtual Herbal Garden
            </span>
            <span className="block text-[11px] text-emerald-400 font-mono tracking-wider uppercase">
              Platform Maintenance
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdminLoginOpen(true)}
          className="border-emerald-600/40 text-emerald-200 hover:bg-emerald-800/40 hover:text-white text-xs gap-1.5"
        >
          <Lock className="w-3.5 h-3.5" />
          {status.allowedRoles?.includes('ADMIN') ? 'Admin Bypass Login' : 'Super Admin Bypass Login'}
        </Button>
      </div>

      {/* Central Content Card */}
      <div className="max-w-2xl w-full mx-auto my-auto text-center z-10 py-10 space-y-8">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide shadow-sm animate-pulse">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Scheduled System Maintenance Active</span>
        </div>

        {/* Headline & Reason */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {status.headline || 'System Maintenance in Progress'}
          </h1>
          <p className="text-emerald-200/80 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {status.reason ||
              'We are currently undergoing scheduled upgrades to optimize 3D botanical rendering, taxonomy datasets, and security.'}
          </p>
        </div>

        {/* Live Countdown Timer */}
        {status.reopenAt && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              <Clock className="w-4 h-4" />
              <span>Estimated Platform Reopening In</span>
            </div>

            {timeLeft.isPast ? (
              <div className="p-4 rounded-2xl bg-emerald-900/40 border border-emerald-500/30 text-emerald-200 text-sm font-medium animate-pulse max-w-md mx-auto">
                <Sparkles className="w-5 h-5 mx-auto mb-1 text-emerald-300" />
                Finalizing maintenance tasks... System will reopen any moment.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-center">
                  <span className="block text-2xl sm:text-4xl font-extrabold text-white font-mono">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs text-emerald-400 uppercase font-semibold">
                    Days
                  </span>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-center">
                  <span className="block text-2xl sm:text-4xl font-extrabold text-white font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs text-emerald-400 uppercase font-semibold">
                    Hours
                  </span>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-center">
                  <span className="block text-2xl sm:text-4xl font-extrabold text-white font-mono">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs text-emerald-400 uppercase font-semibold">
                    Minutes
                  </span>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-center">
                  <span className="block text-2xl sm:text-4xl font-extrabold text-amber-400 font-mono">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs text-emerald-400 uppercase font-semibold">
                    Seconds
                  </span>
                </div>
              </div>
            )}

            {reopenFormatted && (
              <p className="text-xs text-emerald-300/70 pt-1">
                Target Reopening: <strong>{reopenFormatted}</strong> (Your local time)
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-700/30 px-6 py-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking System...' : 'Check Status Now'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsAdminLoginOpen(true)}
            className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/50 hover:text-white text-sm"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Administrator Portal
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-emerald-400/60 z-10">
        <p>Virtual Herbal Garden Platform &copy; {new Date().getFullYear()}. All botanical systems protected.</p>
      </div>

      {/* Admin Bypass Login Modal */}
      <Dialog open={isAdminLoginOpen} onOpenChange={setIsAdminLoginOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border border-emerald-500/30 text-white">
          <form onSubmit={handleAdminLogin}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-100">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                {status.allowedRoles?.includes('ADMIN')
                  ? 'Administrator Bypass Sign In'
                  : 'Super Admin Bypass Sign In'}
              </DialogTitle>
              <DialogDescription className="text-xs text-emerald-300/70">
                {status.allowedRoles?.includes('ADMIN')
                  ? 'Super Admins and Admins can sign in to bypass maintenance mode.'
                  : 'Maintenance bypass is currently restricted to Super Admins only.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {loginError && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {loginError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-200">Email Address</label>
                <Input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="bg-slate-800 border-emerald-600/30 text-white text-xs h-9 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-200">Password</label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="bg-slate-800 border-emerald-600/30 text-white text-xs h-9 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdminLoginOpen(false)}
                className="text-emerald-300 hover:bg-emerald-900/40 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoggingIn}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isLoggingIn
                  ? 'Authenticating...'
                  : status.allowedRoles?.includes('ADMIN')
                  ? 'Sign In as Admin'
                  : 'Sign In as Super Admin'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
