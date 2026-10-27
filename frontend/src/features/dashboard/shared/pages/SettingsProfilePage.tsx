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
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../app/components/ui/card';
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

export function SettingsProfilePage() {
  useDocumentTitle('Settings & Profile | Virtual Herbal Garden');
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

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

  // Danger Zone state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // OAuth detection
  const [isGoogleOAuth, setIsGoogleOAuth] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatarPreview(user.avatarUrl || null);
    }
    // Fetch full profile to inspect oauthAccounts
    getProfile()
      .then((fullProfile) => {
        if (fullProfile) {
          if (fullProfile.displayName) setDisplayName(fullProfile.displayName);
          if (fullProfile.bio) setBio(fullProfile.bio);
          if (fullProfile.avatarUrl) setAvatarPreview(fullProfile.avatarUrl);
          const hasOAuth =
            Array.isArray(fullProfile.oauthAccounts) &&
            fullProfile.oauthAccounts.some((acc: any) => acc.provider === 'google');
          setIsGoogleOAuth(hasOAuth);
        }
      })
      .catch(() => {});
  }, [user]);

  // Prevent browser autofill from populating email into the DELETE confirmation input
  useEffect(() => {
    if (deleteModalOpen) {
      setDeleteConfirmationText('');
      setDeletePassword('');
      const t1 = setTimeout(() => {
        setDeleteConfirmationText((prev) => (prev.includes('@') ? '' : prev));
      }, 50);
      const t2 = setTimeout(() => {
        setDeleteConfirmationText((prev) => (prev.includes('@') ? '' : prev));
      }, 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
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

    // Local preview immediately
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
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Sign Out of All Devices
  const handleLogoutAllDevices = async () => {
    try {
      await logoutAllDevices();
      toast.success('Signed out of all devices');
      await logout();
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sign out of all devices');
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-green-700" />
          Settings & Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your botanical profile, security preferences, and account credentials.
        </p>
      </div>

      {/* Profile Information Card */}
      <Card className="border border-green-200/60 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-green-600" />
            Personal Details
          </CardTitle>
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
                  Accepted formats: WebP, PNG, JPG (up to 5MB). Stored securely on Cloudflare R2.
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

            {/* Email & Role (Read-only) */}
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
                <Label className="text-xs font-medium text-gray-700">Account Role</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs px-2.5 py-1">
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.role || 'USER'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {user?.role === 'BOTANIST'
                      ? 'Authorized knowledge contributor'
                      : user?.role === 'ADMIN'
                      ? 'Platform Administrator'
                      : 'Herbal explorer'}
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

            {/* Bio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="text-xs font-medium text-gray-700">
                  Bio / Botanical Specialty
                </Label>
                <span className="text-[10px] text-gray-400">{bio.length}/500</span>
              </div>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Share your botanical interests, traditional medicine expertise, or regional focus..."
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

      {/* Security & Password Card */}
      <Card className="border border-green-200/60 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-600" />
            Security & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {isGoogleOAuth ? (
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-purple-200 shrink-0">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-purple-900">Google OAuth Account</h4>
                <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                  You signed in using your Google account. Your password and two-factor authentication
                  are managed directly through Google. Password reset is disabled for security.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
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
                  className="bg-purple-700 hover:bg-purple-800 text-white"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Session Management */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Active Sessions</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Revoke all active refresh tokens and sign out of all browsers and devices.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogoutAllDevices}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign Out All Devices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
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

      {/* Delete Account Confirmation Modal */}
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

            {/* Hidden dummy fields to prevent browser password managers from injecting username/email into the challenge field */}
            <input
              type="text"
              name="prevent_autofill_email"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              className="sr-only"
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
            />
            <input
              type="password"
              name="prevent_autofill_password"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              className="sr-only"
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
            />

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
                  data-lpignore="true"
                  data-1p-ignore="true"
                  placeholder="Type DELETE here"
                  className={`text-sm font-mono tracking-wider transition-all ${
                    deleteConfirmationText === 'DELETE'
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold'
                      : 'border-red-200 focus:border-red-400'
                  }`}
                />
                {deleteConfirmationText === 'DELETE' ? (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                    ✓ Confirmation keyword verified
                  </p>
                ) : deleteConfirmationText ? (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Must type the exact word <strong>DELETE</strong> in all caps
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the word: DELETE
                  </p>
                )}
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
                className="flex-1 border-gray-300"
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
