'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MAX_AVATAR_SIZE_MB = 1;

export default function SettingsClient({ user }) {
  const router = useRouter();
  
  // Profile state
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || null);
  const [avatarData, setAvatarData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select an image file.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      setProfileError(`Avatar must be smaller than ${MAX_AVATAR_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
      setAvatarData(event.target.result);
      setProfileError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarData(''); // Empty string signals removal
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError('Name is required.');
      return;
    }

    setProfileLoading(true);

    try {
      const payload = {
        name: name.trim(),
        bio: bio.trim() || null,
      };

      // Only include avatar if changed
      if (avatarData !== null) {
        payload.avatarUrl = avatarData || null;
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfileSuccess('Profile updated successfully!');
      setAvatarData(null); // Reset avatar change tracking
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-emerald-900">Settings</h2>
        <p className="text-sm text-emerald-600">
          Manage your profile and account settings
        </p>
      </div>

      {/* Profile Section */}
      <div className="border-t border-emerald-100 pt-8">
        <h3 className="mb-4 text-lg font-semibold text-emerald-900">
          Edit Profile
        </h3>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Avatar */}
          <div>
            <label className="mb-2 block text-sm font-medium text-emerald-900">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full object-cover border-2 border-emerald-100"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 text-2xl font-semibold text-white">
                  {name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-200">
                  Change photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-emerald-900">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Your name"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-emerald-900">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-emerald-600"
            />
            <p className="mt-1 text-xs text-emerald-500">
              Email cannot be changed
            </p>
          </div>

          {/* Handle (read-only) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-emerald-900">
              Handle
            </label>
            <input
              type="text"
              value={`@${user.handle}`}
              disabled
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-emerald-600"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1 block text-sm font-medium text-emerald-900">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Tell us about yourself..."
            />
            <p className="mt-1 text-right text-xs text-emerald-500">
              {bio.length}/500
            </p>
          </div>

          {/* Error/Success Messages */}
          {profileError && (
            <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-600">
              {profileSuccess}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
            >
              {profileLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="border-t border-emerald-100 pt-8">
        <h3 className="mb-4 text-lg font-semibold text-emerald-900">
          Change Password
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-emerald-900">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-emerald-900">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-emerald-900">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-emerald-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Confirm new password"
            />
          </div>

          {/* Error/Success Messages */}
          {passwordError && (
            <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-600">
              {passwordSuccess}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {passwordLoading ? 'Changing...' : 'Change password'}
            </button>
          </div>
        </form>
      </div>

      {/* Logout Section */}
      <div className="border-t border-emerald-100 pt-8">
        <h3 className="mb-4 text-lg font-semibold text-emerald-900">Account</h3>
        <a
          href="/api/auth/logout"
          className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Log out
        </a>
      </div>
    </div>
  );
}

