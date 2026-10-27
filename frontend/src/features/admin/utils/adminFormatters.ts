import type { UserRole } from '../types/admin.types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  GUEST: 0,
  USER: 1,
  BOTANIST: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export const ROLE_BADGES: Record<UserRole, string> = {
  GUEST: 'bg-slate-100 text-slate-700 border-slate-300',
  USER: 'bg-blue-100 text-blue-800 border-blue-200',
  BOTANIST: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN: 'bg-amber-100 text-amber-800 border-amber-200',
  SUPER_ADMIN: 'bg-red-100 text-red-800 border-red-200',
};

/**
 * Safely format any date input (string, Date, number, null, undefined)
 */
export function safeFormatDate(dateValue: any, fallback = 'Never'): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString();
  } catch {
    return fallback;
  }
}

/**
 * Safely format date with time
 */
export function safeFormatDateTime(dateValue: any, fallback = 'Never'): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString();
  } catch {
    return fallback;
  }
}

/**
 * Returns a valid UserRole, defaulting to USER for null/undefined/invalid values
 */
export function safeRole(roleValue: any): UserRole {
  if (typeof roleValue === 'string') {
    const upper = roleValue.toUpperCase();
    if (upper in ROLE_HIERARCHY) {
      return upper as UserRole;
    }
  }
  return 'USER';
}

/**
 * Safe CSS class lookup for role badge
 */
export function safeRoleBadgeClass(roleValue: any): string {
  const role = safeRole(roleValue);
  return ROLE_BADGES[role] || 'bg-slate-100 text-slate-700 border-slate-300';
}

/**
 * Returns a safe display name
 */
export function safeDisplayName(user: any, fallback = 'Unknown User'): string {
  if (!user) return fallback;
  if (typeof user === 'string' && user.trim()) return user.trim();
  if (user.displayName && typeof user.displayName === 'string' && user.displayName.trim()) {
    return user.displayName.trim();
  }
  if (user.name && typeof user.name === 'string' && user.name.trim()) {
    return user.name.trim();
  }
  if (user.email && typeof user.email === 'string' && user.email.includes('@')) {
    return user.email.split('@')[0];
  }
  return fallback;
}

/**
 * Returns a safe avatar initial
 */
export function safeAvatarInitial(nameValue: any, fallback = 'U'): string {
  if (!nameValue || typeof nameValue !== 'string') return fallback;
  const trimmed = nameValue.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : fallback;
}

/**
 * Mask an email for privacy or fallback to "No email"
 */
export function maskEmail(email: any): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'No email';
  }
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Safe numeric count
 */
export function safeCount(value: any, fallback = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
}
