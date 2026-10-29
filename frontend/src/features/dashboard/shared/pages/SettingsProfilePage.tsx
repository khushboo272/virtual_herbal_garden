import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  Upload,
  Camera,
  LogOut,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Trash2,
  Lock,
  QrCode,
  Smartphone,
  Copy,
  Download,
  Laptop,
  Globe,
  Clock,
  History,
  Bell,
  Activity,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../app/components/ui/card';
import { Button } from '../../../../app/components/ui/button';
import { Input } from '../../../../app/components/ui/input';
import { Label } from '../../../../app/components/ui/label';
import { Textarea } from '../../../../app/components/ui/textarea';
import { Badge } from '../../../../app/components/ui/badge';
import { useAuth } from '../../../../contexts/AuthContext';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  logoutAllDevices,
  deleteAccount,
} from '../api/sharedDashboardApi';
import { systemApi } from '../../../system/api/system.api';
import { useReauth } from '../../../system/hooks/useReauth';
import { ReauthDialog } from '../../../system/components/ReauthDialog';
import {
  ISessionItem,
  INotificationPreferences,
  ITwoFactorStatus,
  IAuditLogItem,
} from '../../../system/types/system.types';

// ── Role-Aware Copy Configuration ──
interface RoleCopyConfig {
  badgeLabel: string;
  badgeColor: string;
  roleDescription: string;
  pageSubtitle: string;
  bioLabel: string;
  bioPlaceholder: string;
}

const ROLE_COPY_CONFIG: Record<string, RoleCopyConfig> = {
  SUPER_ADMIN: {
    badgeLabel: 'Super Administrator',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    roleDescription: 'Platform owner with full system access and governance controls',
    pageSubtitle: 'Manage your administrator credentials, two-factor authentication, active sessions, and system notifications.',
    bioLabel: 'Admin Bio / Department Notes',
    bioPlaceholder: 'System administration, infrastructure oversight, security governance...',
  },
  ADMIN: {
    badgeLabel: 'Platform Administrator',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    roleDescription: 'Platform administrator with content moderation and user management oversight',
    pageSubtitle: 'Manage your administrative profile, authentication security, active sessions, and notifications.',
    bioLabel: 'Admin Bio / Role Notes',
    bioPlaceholder: 'Community moderation, editorial management, platform operations...',
  },
  BOTANIST: {
    badgeLabel: 'Botanist Contributor',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    roleDescription: 'Authorized botanical researcher and medicinal plant contributor',
    pageSubtitle: 'Manage your botanical profile, research specialty, account security, and contribution preferences.',
    bioLabel: 'Bio / Botanical Specialty',
    bioPlaceholder: 'Share your botanical expertise, ethnobotanical studies, or medicinal research focus...',
  },
  USER: {
    badgeLabel: 'Community Member',
    badgeColor: 'bg-green-100 text-green-800 border-green-200',
    roleDescription: 'Registered herbal garden explorer and community participant',
    pageSubtitle: 'Manage your personal profile, security credentials, active devices, and notification preferences.',
    bioLabel: 'Personal Bio / Herbal Interests',
    bioPlaceholder: 'Share your interests in herbal remedies, gardening, or traditional wellness practices...',
  },
  GUEST: {
    badgeLabel: 'Guest Visitor',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    roleDescription: 'Unauthenticated visitor',
    pageSubtitle: 'Manage guest preferences and account registration.',
    bioLabel: 'Bio',
    bioPlaceholder: 'Tell us about yourself...',
  },
};

export function SettingsProfilePage() {
  useDocumentTitle('Settings & Profile | Virtual Herbal Garden');
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const reauth = useReauth();

  const userRole = (user?.role || 'USER').toUpperCase();
  const roleCopy = ROLE_COPY_CONFIG[userRole] || ROLE_COPY_CONFIG.USER;
  const isAdminOrSuper = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Profile Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [lastPasswordChange, setLastPasswordChange] = useState<string | null>(null);

  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState<ITwoFactorStatus | null>(null);
  const is2faActive = Boolean(twoFactorStatus?.is2faEnabled ?? (twoFactorStatus as any)?.enabled);
  const remainingCodes = twoFactorStatus?.remainingBackupCodes ?? (twoFactorStatus as any)?.backupCodesCount;
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string; qrCodeUrl: string } | null>(null);
  const [totpVerificationCode, setTotpVerificationCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [backupCodesModal, setBackupCodesModal] = useState<string[] | null>(null);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<ISessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // Login history state
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);

  // Notification Preferences state
  const [preferences, setPreferences] = useState<INotificationPreferences>({
    newSubmission: true,
    roleApplication: true,
    support: true,
    flaggedReview: true,
    security: true,
    system: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Admin Activity state
  const [adminActivity, setAdminActivity] = useState<IAuditLogItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Danger Zone state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // OAuth detection
  const [isGoogleOAuth, setIsGoogleOAuth] = useState(false);

  // Load profile, 2FA status, sessions, preferences, and login history
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatarPreview(user.avatarUrl || null);
    }

    getProfile()
      .then((fullProfile) => {
        if (fullProfile) {
          if (fullProfile.displayName) setDisplayName(fullProfile.displayName);
          if (fullProfile.bio) setBio(fullProfile.bio);
          if (fullProfile.avatarUrl) setAvatarPreview(fullProfile.avatarUrl);
          if (fullProfile.passwordChangedAt) {
            setLastPasswordChange(fullProfile.passwordChangedAt);
          }
          const hasOAuth =
            Array.isArray(fullProfile.oauthAccounts) &&
            fullProfile.oauthAccounts.some((acc: any) => acc.provider === 'google');
          setIsGoogleOAuth(hasOAuth);
        }
      })
      .catch(() => {});

    load2faStatus();
    loadSessions();
    loadPreferences();
    loadLoginHistory();
    if (isAdminOrSuper) {
      loadAdminActivity();
    }
  }, [user, isAdminOrSuper]);

  const load2faStatus = async () => {
    try {
      setTwoFactorLoading(true);
      const status = await systemApi.get2faStatus();
      setTwoFactorStatus(status);
    } catch {
      // 2FA status query failed or unconfigured
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await systemApi.getMySessions();
      setSessions(data || []);
    } catch {
      // Session load fail
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      setPrefsLoading(true);
      const data = await systemApi.getMyPreferences();
      if (data) setPreferences(data);
    } catch {
      // Preferences fail
    } finally {
      setPrefsLoading(false);
    }
  };

  const loadLoginHistory = async () => {
    try {
      setLoginHistoryLoading(true);
      const data = await systemApi.getMyLoginHistory();
      setLoginHistory(data || []);
    } catch {
      // History fail
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  const loadAdminActivity = async () => {
    try {
      setActivityLoading(true);
      const res = await systemApi.getAuditLogs({ limit: 10 });
      setAdminActivity(res.logs || []);
    } catch {
      // Activity fail
    } finally {
      setActivityLoading(false);
    }
  };

  // Prevent browser autofill from populating email into the DELETE confirmation input
  useEffect(() => {
    if (deleteModalOpen) {
      setDeleteConfirmationText('');
      setDeletePassword('');
    }
  }, [deleteModalOpen]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    try {
      setProfileLoading(true);
      await updateProfile({ displayName: displayName.trim(), bio: bio.trim() });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Avatar File Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setAvatarUploading(true);
      const res = await uploadAvatar(file);
      setAvatarPreview(res.avatarUrl);
      await refreshUser();
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload avatar');
      setAvatarPreview(user?.avatarUrl || null);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLastPasswordChange(new Date().toISOString());
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 2FA Wizard: Step 1 (Setup)
  const handleStart2faSetup = async () => {
    try {
      setTwoFactorLoading(true);
      const data = await systemApi.setup2fa();
      setSetupData(data);
      setTotpVerificationCode('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initialize 2FA setup');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // 2FA Wizard: Step 2 (Verify and Show Backup Codes)
  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpVerificationCode.trim()) {
      toast.error('Please enter the 6-digit code from your authenticator app');
      return;
    }
    try {
      setVerifyLoading(true);
      const res = await systemApi.verify2fa(totpVerificationCode.trim());
      toast.success('Two-factor authentication enabled successfully!');
      setSetupData(null);
      setTotpVerificationCode('');
      setBackupCodesModal(res.backupCodes || []);
      await load2faStatus();
      await refreshUser();
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Regenerate Backup Codes (Requires Step-Up Reauth)
  const handleRegenerateBackupCodes = () => {
    reauth.triggerReauth(async (token) => {
      try {
        const res = await systemApi.regenerateBackupCodes(token);
        setBackupCodesModal(res.backupCodes || []);
        toast.success('New backup codes generated');
        await load2faStatus();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to regenerate backup codes');
      }
    });
  };

  // Disable 2FA (Requires Step-Up Reauth + valid TOTP code)
  const handleDisable2faSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode.trim()) {
      toast.error('Please enter a valid TOTP code');
      return;
    }
    reauth.triggerReauth(async (token) => {
      try {
        setDisableLoading(true);
        await systemApi.disable2fa(disableCode.trim(), token);
        toast.success('Two-factor authentication has been disabled');
        setDisableModalOpen(false);
        setDisableCode('');
        await load2faStatus();
        await refreshUser();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to disable 2FA');
      } finally {
        setDisableLoading(false);
      }
    });
  };

  // Session Management
  const handleRevokeSingleSession = async (sessionId: string) => {
    try {
      setRevokingSessionId(sessionId);
      await systemApi.deleteMySession(sessionId);
      toast.success('Session revoked');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to revoke session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      setRevokingOthers(true);
      await systemApi.revokeOtherSessions();
      toast.success('All other devices have been signed out');
      await loadSessions();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sign out other devices');
    } finally {
      setRevokingOthers(false);
    }
  };

  // Notification Preferences Update
  const handleTogglePreference = (key: keyof INotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    try {
      setPrefsSaving(true);
      await systemApi.updateMyPreferences(preferences);
      toast.success('Notification preferences updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update preferences');
    } finally {
      setPrefsSaving(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await deleteAccount({
        confirmation: deleteConfirmationText.trim(),
        password: deletePassword ? deletePassword : undefined,
      });
      toast.success('Your account has been deleted');
      await logout();
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const initials = (user?.displayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Role-Aware Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-green-700" />
            Settings & Profile
          </h1>
          <Badge className={`${roleCopy.badgeColor} border text-xs px-2.5 py-1`}>
            <Shield className="w-3.5 h-3.5 mr-1" />
            {roleCopy.badgeLabel}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          {roleCopy.pageSubtitle}
        </p>
      </div>

      {/* ── Section 1: Personal Details ── */}
      <Card className="border border-green-200/60 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-green-600" />
            Personal Details
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            {roleCopy.roleDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-200 bg-green-50 flex items-center justify-center text-green-800 font-bold text-xl shadow-xs">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={user?.displayName || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 p-1.5 bg-green-700 hover:bg-green-800 text-white rounded-full shadow-md transition-colors"
                  title="Upload new avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">Profile Photo</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Accepted formats: WebP, PNG, JPG (up to 5MB).
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs border-green-300 text-green-700 hover:bg-green-50"
                  disabled={avatarUploading}
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Upload Photo
                </Button>
              </div>
            </div>

            {/* Email & Role Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="pl-9 bg-slate-50 border-slate-200 text-sm text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {isGoogleOAuth ? 'Google Verified Account' : 'Account Active'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">System Role</Label>
                <div className="flex items-center gap-2 pt-1.5">
                  <Badge className={`${roleCopy.badgeColor} border text-xs px-2.5 py-1`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {roleCopy.badgeLabel}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {roleCopy.roleDescription}
                  </span>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-medium text-gray-700">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Jane Doe"
                className="border-green-200 focus:border-green-400 text-sm"
                required
              />
            </div>

            {/* Bio (Role-Aware) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="text-xs font-medium text-gray-700">
                  {roleCopy.bioLabel}
                </Label>
                <span className="text-[10px] text-gray-400">{bio.length}/500</span>
              </div>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                rows={3}
                placeholder={roleCopy.bioPlaceholder}
                className="border-green-200 focus:border-green-400 text-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={profileLoading}
                className="bg-green-700 hover:bg-green-800 text-white px-5"
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Section 2: Security & Authentication (2FA Center + Password) ── */}
      <Card className="border border-green-200/60 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-600" />
            Security & Authentication
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Configure two-factor authentication, account passwords, and credential protections.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* 2FA Sub-section */}
          <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg border shrink-0 ${is2faActive ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">Two-Factor Authentication (2FA)</h4>
                        {is2faActive ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[11px]">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
                        Protects your account by requiring an authenticator app code (Google Authenticator, Authy, 1Password) in addition to your password.
                        {is2faActive && remainingCodes !== undefined && (
                          <span className="block mt-0.5 text-slate-600">
                            Remaining backup codes: <strong>{remainingCodes}</strong> of 10.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {is2faActive ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRegenerateBackupCodes}
                          className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          New Backup Codes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDisableModalOpen(true)}
                          className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Disable 2FA
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleStart2faSetup}
                        disabled={twoFactorLoading || !!setupData}
                        className="text-xs bg-purple-700 hover:bg-purple-800 text-white"
                      >
                    {twoFactorLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <QrCode className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Set Up 2FA
                  </Button>
                )}
              </div>
            </div>

            {/* 2FA Setup Flow (QR + Verification) */}
            {setupData && !is2faActive && (
              <div className="p-5 border border-purple-200 rounded-xl bg-purple-50/40 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-purple-700" />
                    Scan QR Code in Authenticator App
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSetupData(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-purple-100 shadow-xs">
                    {setupData.qrCodeUrl ? (
                      <img
                        src={setupData.qrCodeUrl}
                        alt="2FA QR Code"
                        className="w-44 h-44 object-contain"
                      />
                    ) : (
                      <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-xs text-gray-400">
                        QR Code Loading...
                      </div>
                    )}
                    <span className="text-[11px] text-gray-500 mt-2">
                      Scan with Google Authenticator or Authy
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-gray-700">Manual Entry Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-purple-800 tracking-wider select-all break-all flex-1">
                          {setupData.secret}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(setupData.secret);
                            toast.success('Key copied to clipboard');
                          }}
                          className="shrink-0 text-xs"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>

                    <form onSubmit={handleVerify2fa} className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="totpCodeInput" className="text-xs font-medium text-gray-700">
                          Enter 6-Digit Code from App
                        </Label>
                        <Input
                          id="totpCodeInput"
                          value={totpVerificationCode}
                          onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          maxLength={6}
                          className="font-mono text-center tracking-widest text-lg font-bold border-purple-200 focus:border-purple-400 max-w-[200px]"
                          autoFocus
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="submit"
                          disabled={verifyLoading || totpVerificationCode.length !== 6}
                          className="bg-purple-700 hover:bg-purple-800 text-white text-xs px-4"
                        >
                          {verifyLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              Verifying...
                            </>
                          ) : (
                            'Confirm & Enable 2FA'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSetupData(null)}
                          className="text-xs text-gray-500"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Change Sub-section */}
          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Account Password</h4>
            {lastPasswordChange && (
              <p className="text-xs text-gray-500 mb-4">
                Last changed on {new Date(lastPasswordChange).toLocaleDateString()} at{' '}
                {new Date(lastPasswordChange).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            {isGoogleOAuth ? (
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-purple-200 shrink-0">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Google OAuth Account</h4>
                  <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                    You signed in using your Google account. Your password and account recovery
                    are managed directly through your Google Account.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-xs font-medium text-gray-700">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 border-slate-200 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-xs font-medium text-gray-700">
                      New Password (min 8 chars)
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-slate-200 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-slate-200 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs px-4"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Active Sessions ── */}
      <Card className="border border-green-200/60 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-600" />
                Active Sessions & Devices
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Manage signed-in web browsers and active refresh tokens across devices.
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRevokeOtherSessions}
                disabled={revokingOthers}
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
              >
                {revokingOthers ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                )}
                Sign Out All Other Devices
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-700" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              No other active sessions found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {sess.deviceInfo?.browser || 'Browser'} on {sess.deviceInfo?.os || 'Device'}
                        </span>
                        {sess.isCurrent && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-2 py-0.5">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <span>IP: <span className="font-mono">{sess.ip || 'Unknown'}</span></span>
                        <span>•</span>
                        <span>
                          Last active:{' '}
                          {sess.lastUsedAt ? new Date(sess.lastUsedAt).toLocaleString() : new Date(sess.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSingleSession(sess.id)}
                      disabled={revokingSessionId === sess.id}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 self-start sm:self-center"
                    >
                      {revokingSessionId === sess.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <X className="w-3.5 h-3.5 mr-1" />
                      )}
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 4: Login History (Last 20) ── */}
      <Card className="border border-green-200/60 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            Login History
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Recent authentication events and login attempts on your account (last 20 entries).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loginHistoryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-700" />
            </div>
          ) : loginHistory.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              No recent login history recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Event</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">IP Address</th>
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loginHistory.map((item, idx) => {
                    const isSuccess = item.action === 'LOGIN';
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-medium text-gray-900">
                          {isSuccess ? 'Account Login' : 'Login Attempt'}
                        </td>
                        <td className="py-2 px-3">
                          {isSuccess ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                              Success
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px]">
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {item.ipAddress || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-xs">
                          {item.details?.reason ? String(item.details.reason) : item.userAgent || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 5: Notification Preferences (Role-Relevant Toggles) ── */}
      <Card className="border border-green-200/60 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Customize the notification channels and alerts you receive.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePreferences}
              disabled={prefsSaving}
              className="bg-green-700 hover:bg-green-800 text-white text-xs px-3.5"
            >
              {prefsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
              Save Preferences
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {prefsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-green-700" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Universal: Security Alerts */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60">
                <div>
                  <h4 className="text-xs font-semibold text-gray-900">Security Alerts</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Critical alerts for new logins, password resets, and 2FA changes. (Security notices cannot be fully disabled)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.security}
                  onChange={() => handleTogglePreference('security')}
                  className="rounded text-green-700 focus:ring-green-500 mt-0.5 h-4 w-4"
                />
              </div>

              {/* Universal: System Updates */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60">
                <div>
                  <h4 className="text-xs font-semibold text-gray-900">System Updates & Announcements</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Platform maintenance notices, version upgrades, and feature announcements.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.system}
                  onChange={() => handleTogglePreference('system')}
                  className="rounded text-green-700 focus:ring-green-500 mt-0.5 h-4 w-4"
                />
              </div>

              {/* BOTANIST / ADMIN / SUPER_ADMIN: New Submissions */}
              {(userRole === 'BOTANIST' || isAdminOrSuper) && (
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900">New Content Submissions</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Alerts when new plants or herbal remedies are submitted for peer review.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.newSubmission}
                    onChange={() => handleTogglePreference('newSubmission')}
                    className="rounded text-green-700 focus:ring-green-500 mt-0.5 h-4 w-4"
                  />
                </div>
              )}

              {/* BOTANIST / ADMIN / SUPER_ADMIN: Flagged Content */}
              {(userRole === 'BOTANIST' || isAdminOrSuper) && (
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900">Flagged Content & Reports</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Notifications when community reports or moderation flags are submitted.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.flaggedReview}
                    onChange={() => handleTogglePreference('flaggedReview')}
                    className="rounded text-green-700 focus:ring-green-500 mt-0.5 h-4 w-4"
                  />
                </div>
              )}

              {/* ADMIN / SUPER_ADMIN: Role Applications */}
              {isAdminOrSuper && (
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900">Contributor & Role Applications</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Alerts when users submit applications to become Botanist contributors.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.roleApplication}
                    onChange={() => handleTogglePreference('roleApplication')}
                    className="rounded text-green-700 focus:ring-green-500 mt-0.5 h-4 w-4"
                  />
                </div>
              )}

              {/* ADMIN / SUPER_ADMIN: Support Inquiries */}
              {isAdminOrSuper && (
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900">User Support & Help Inquiries</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Notifications for support tickets, feedback submissions, and contact inquiries.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.support}
                    onChange={() => handleTogglePreference('support')}
                    className="rounded text-green-700 focus:ring-green-500 mt-0.5 h-4 w-4"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 6: My Recent Admin Activity (ADMIN+ only) ── */}
      {isAdminOrSuper && (
        <Card className="border border-green-200/60 shadow-xs bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              My Recent Admin Activity
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Audit log of your recent administrative and moderation operations across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {activityLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-green-700" />
              </div>
            ) : adminActivity.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">
                No recent administrative activity recorded.
              </div>
            ) : (
              <div className="space-y-2">
                {adminActivity.map((act) => (
                  <div
                    key={act._id}
                    className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                        {act.action}
                      </Badge>
                      <span className="font-medium text-gray-800">
                        {act.targetType || 'System'}
                      </span>
                      {act.ipAddress && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({act.ipAddress})
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Danger Zone ── */}
      <Card className="border border-red-200 shadow-xs bg-red-50/20">
        <CardHeader className="border-b border-red-100 pb-4">
          <CardTitle className="text-base font-semibold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delete Account</h4>
              <p className="text-xs text-gray-500 mt-0.5 max-w-md">
                Permanently delete your profile, bookmarks, and private garden. Published medicinal
                contributions will remain attributed or preserved according to platform policies.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmationText('');
                setDeletePassword('');
                setDeleteModalOpen(true);
              }}
              className="border-red-300 text-red-600 hover:bg-red-50 shrink-0 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Modal: 2FA Backup Codes Display (Shown Once) ── */}
      {backupCodesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-purple-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Save Your 2FA Backup Codes</h3>
                <p className="text-xs text-gray-500">
                  Each one-time code can be used to sign in if you lose access to your authenticator app.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> These backup codes will <em>never</em> be displayed again. Save or download them now before closing this window.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-sm font-semibold tracking-wider text-slate-800">
              {backupCodesModal.map((code, idx) => (
                <div key={idx} className="bg-white py-1.5 px-2 rounded border border-slate-200 shadow-2xs">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(backupCodesModal.join('\n'));
                  toast.success('Backup codes copied to clipboard');
                }}
                className="text-xs flex-1"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy All Codes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([backupCodesModal.join('\n')], { type: 'text/plain' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `herbal-garden-backup-codes-${new Date().toISOString().slice(0, 10)}.txt`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success('Backup codes downloaded');
                }}
                className="text-xs flex-1"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download as .txt
              </Button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                type="button"
                onClick={() => setBackupCodesModal(null)}
                className="bg-green-700 hover:bg-green-800 text-white text-xs px-5"
              >
                I Have Saved My Codes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Disable 2FA Prompt ── */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Disable Two-Factor Authentication</h3>
                <p className="text-xs text-gray-500">
                  Enter your current authenticator code to confirm. Re-authentication is required.
                </p>
              </div>
            </div>

            <form onSubmit={handleDisable2faSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="disableCodeInput" className="text-xs font-medium text-gray-700">
                  Current 6-Digit Authenticator Code
                </Label>
                <Input
                  id="disableCodeInput"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="font-mono text-center tracking-widest text-lg font-bold border-red-200 focus:border-red-400"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDisableModalOpen(false)}
                  className="flex-1 text-xs"
                  disabled={disableLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={disableLoading || disableCode.length !== 6}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  {disableLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    'Disable 2FA'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Account Confirmation ── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Delete Account Permanently?</h3>
              <p className="text-xs text-gray-500 mt-1">
                This action is irreversible. All your bookmarks, cultivation data, and personal records
                will be deleted.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="delete-challenge-input" className="text-xs font-semibold text-gray-700">
                    Type <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">DELETE</span> to confirm:
                  </Label>
                  {deleteConfirmationText && deleteConfirmationText !== 'DELETE' && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmationText('')}
                      className="text-[11px] text-red-600 hover:text-red-800 font-medium underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <Input
                  id="delete-challenge-input"
                  name="delete-security-keyword"
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes('@')) {
                      setDeleteConfirmationText('');
                    } else {
                      setDeleteConfirmationText(val.toUpperCase());
                    }
                  }}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck="false"
                  placeholder="Type DELETE here"
                  className={`text-sm font-mono tracking-wider transition-all ${
                    deleteConfirmationText === 'DELETE'
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold'
                      : 'border-red-200 focus:border-red-400'
                  }`}
                />
              </div>

              {!isGoogleOAuth && (
                <div className="space-y-1">
                  <Label htmlFor="delete-account-password" className="text-xs font-medium text-gray-700">
                    Enter your current password:
                  </Label>
                  <Input
                    id="delete-account-password"
                    name="delete-account-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="border-red-200 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 border-gray-300 text-xs"
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={
                  deleteLoading ||
                  deleteConfirmationText.trim() !== 'DELETE' ||
                  (!isGoogleOAuth && !deletePassword)
                }
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step-up Reauth Dialog */}
      <ReauthDialog
        isOpen={reauth.isOpen}
        onSuccess={reauth.handleSuccess}
        onCancel={reauth.handleCancel}
      />
    </div>
  );
}
