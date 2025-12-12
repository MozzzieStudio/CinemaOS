/**
 * Clerk Authentication Configuration
 * 
 * Based on research: https://clerk.com/
 * 
 * Features:
 * - MFA support
 * - Social SSO (20+ providers)
 * - Bot detection
 * - Session management
 * - SOC 2 Type 2 compliant
 * 
 * This module provides configuration for Clerk integration in CinemaOS Cloud.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ClerkUser {
  id: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  primaryEmailAddress?: string;
  primaryPhoneNumber?: string;
  profileImageUrl?: string;
  publicMetadata: Record<string, unknown>;
  privateMetadata: Record<string, unknown>;
  unsafeMetadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface ClerkSession {
  id: string;
  userId: string;
  status: 'active' | 'ended' | 'removed' | 'replaced' | 'abandoned' | 'expired';
  expireAt: number;
  abandonAt: number;
  lastActiveAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface ClerkOrganization {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  membersCount: number;
  pendingInvitationsCount: number;
  publicMetadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export type ClerkRole = 'admin' | 'member' | 'guest';

export interface ClerkMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: ClerkRole;
  createdAt: number;
  updatedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface ClerkConfig {
  publishableKey: string;
  secretKey?: string; // Only used on backend
  domain?: string;
  isSatellite?: boolean;
  proxy?: string;
  signInUrl?: string;
  signUpUrl?: string;
  afterSignInUrl?: string;
  afterSignUpUrl?: string;
}

/**
 * Default Clerk configuration for CinemaOS
 * Note: Keys should come from environment variables
 */
export function getClerkConfig(): ClerkConfig {
  return {
    publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
    afterSignInUrl: '/dashboard',
    afterSignUpUrl: '/onboarding',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════════

export type SocialProvider = 
  | 'google' | 'github' | 'discord' | 'twitter' | 'facebook'
  | 'apple' | 'microsoft' | 'linkedin' | 'slack' | 'spotify'
  | 'twitch' | 'notion' | 'figma' | 'dropbox' | 'gitlab';

export const SOCIAL_PROVIDERS: Record<SocialProvider, { name: string; icon: string }> = {
  google: { name: 'Google', icon: '🔵' },
  github: { name: 'GitHub', icon: '⚫' },
  discord: { name: 'Discord', icon: '🟣' },
  twitter: { name: 'X (Twitter)', icon: '🐦' },
  facebook: { name: 'Facebook', icon: '🔵' },
  apple: { name: 'Apple', icon: '🍎' },
  microsoft: { name: 'Microsoft', icon: '🔷' },
  linkedin: { name: 'LinkedIn', icon: '🔗' },
  slack: { name: 'Slack', icon: '💬' },
  spotify: { name: 'Spotify', icon: '🎵' },
  twitch: { name: 'Twitch', icon: '🎮' },
  notion: { name: 'Notion', icon: '📝' },
  figma: { name: 'Figma', icon: '🎨' },
  dropbox: { name: 'Dropbox', icon: '📦' },
  gitlab: { name: 'GitLab', icon: '🦊' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS & ROLES (CinemaOS specific)
// ═══════════════════════════════════════════════════════════════════════════════

export type CinemaOSPermission = 
  | 'project:read' | 'project:write' | 'project:delete' | 'project:share'
  | 'asset:read' | 'asset:write' | 'asset:delete'
  | 'team:invite' | 'team:manage' | 'team:billing'
  | 'ai:generate' | 'ai:unlimited';

export interface CinemaOSRole {
  name: string;
  permissions: CinemaOSPermission[];
}

export const CINEMAOS_ROLES: Record<string, CinemaOSRole> = {
  owner: {
    name: 'Owner',
    permissions: [
      'project:read', 'project:write', 'project:delete', 'project:share',
      'asset:read', 'asset:write', 'asset:delete',
      'team:invite', 'team:manage', 'team:billing',
      'ai:generate', 'ai:unlimited',
    ],
  },
  admin: {
    name: 'Admin',
    permissions: [
      'project:read', 'project:write', 'project:share',
      'asset:read', 'asset:write', 'asset:delete',
      'team:invite', 'team:manage',
      'ai:generate',
    ],
  },
  editor: {
    name: 'Editor',
    permissions: [
      'project:read', 'project:write',
      'asset:read', 'asset:write',
      'ai:generate',
    ],
  },
  viewer: {
    name: 'Viewer',
    permissions: [
      'project:read',
      'asset:read',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if user has permission
 */
export function hasPermission(
  userRole: string,
  requiredPermission: CinemaOSPermission
): boolean {
  const role = CINEMAOS_ROLES[userRole];
  if (!role) return false;
  return role.permissions.includes(requiredPermission);
}

/**
 * Get user's display name
 */
export function getUserDisplayName(user: ClerkUser): string {
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }
  if (user.username) return user.username;
  if (user.primaryEmailAddress) return user.primaryEmailAddress.split('@')[0];
  return 'User';
}

/**
 * Check if session is valid
 */
export function isSessionValid(session: ClerkSession): boolean {
  const now = Date.now();
  return session.status === 'active' && session.expireAt > now;
}

/**
 * Get initials from user for avatar
 */
export function getUserInitials(user: ClerkUser): string {
  const name = getUserDisplayName(user);
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
