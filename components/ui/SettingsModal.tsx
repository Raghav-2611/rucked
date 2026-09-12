'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { LogOut, X, Shield, Bell, Info, AtSign, Check, Loader2, User } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: Profile | null;
  onSignOut?: () => void;
  onUpdateProfile?: (updated: Profile) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentProfile,
  onSignOut,
  onUpdateProfile,
}: SettingsModalProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentProfile) {
      setUsername(currentProfile.username || '');
      setDisplayName(currentProfile.display_name || '');
    }
    setError(null);
    setSuccess(null);
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const initial = currentProfile?.display_name?.[0]?.toUpperCase() || currentProfile?.username?.[0]?.toUpperCase() || 'U';

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile || isSubmitting) return;

    setError(null);
    setSuccess(null);

    const cleanedTag = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanedDisplayName = displayName.trim();

    if (!cleanedTag || cleanedTag.length < 3) {
      setError('Unique tag must be at least 3 characters (letters, numbers, underscores only).');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Check if unique tag is taken by another user
      if (cleanedTag !== currentProfile.username) {
        const { data: existingUser, error: checkErr } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanedTag)
          .neq('id', currentProfile.id)
          .maybeSingle();

        if (checkErr) {
          console.warn('Tag uniqueness check warning:', checkErr.message);
        }

        if (existingUser) {
          setError(`The tag "@${cleanedTag}" is already taken by another user. Please choose a different unique tag.`);
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Perform update in profiles table
      const updatedData = {
        username: cleanedTag,
        display_name: cleanedDisplayName || cleanedTag,
      };

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', currentProfile.id);

      if (updateErr) {
        if (updateErr.code === '23505' || updateErr.message.toLowerCase().includes('unique')) {
          setError(`The tag "@${cleanedTag}" is already taken. Please choose another tag.`);
        } else {
          setError(updateErr.message || 'Could not update tag. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      // 3. Update local state & parent callback
      const newProfile: Profile = {
        ...currentProfile,
        username: cleanedTag,
        display_name: cleanedDisplayName || cleanedTag,
      };

      if (onUpdateProfile) {
        onUpdateProfile(newProfile);
      }

      setSuccess(`Unique tag updated to @${cleanedTag} successfully!`);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while updating profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="bg-[#202C33] border border-[#2A3942] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#111B21] border-b border-[#2A3942] flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold text-[#E9EDEF]">Settings</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* User Profile Card */}
          <div className="flex items-center gap-4 p-3.5 bg-[#111B21] border border-[#2A3942] rounded-xl">
            <div className="w-14 h-14 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884] font-extrabold text-xl shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-[#E9EDEF] truncate">
                {currentProfile?.display_name || 'User Profile'}
              </h4>
              <p className="text-xs text-[#8696A0] truncate">
                @{currentProfile?.username || 'username'}
              </p>
              <p className="text-[11px] text-[#00A884] mt-0.5 font-medium">
                Active Session
              </p>
            </div>
          </div>

          {/* Edit Unique Tag Form */}
          <form onSubmit={handleSaveTag} className="p-4 bg-[#111B21] border border-[#2A3942] rounded-xl space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00A884] uppercase tracking-wider">
              <AtSign className="w-4 h-4" />
              <span>Update Unique Tag & Profile</span>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {success && (
              <div className="p-2.5 rounded-lg bg-[#00A884]/10 border border-[#00A884]/30 text-[#00A884] text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{success}</span>
              </div>
            )}

            {/* Display Name Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#8696A0]">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg pl-9 pr-3 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                />
              </div>
            </div>

            {/* Unique Tag Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#8696A0]">Unique Tag (@handle)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] font-bold text-xs">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="unique_tag"
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg pl-7 pr-3 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                />
              </div>
              <p className="text-[10px] text-[#8696A0]">Letters, numbers, underscores only. Must be unique.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-3 bg-[#00A884] hover:bg-[#008f70] active:bg-[#007a5e] text-white font-bold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking availability…</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Unique Tag</span>
                </>
              )}
            </button>
          </form>

          {/* Settings Info Items */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl text-xs text-[#E9EDEF] bg-[#111B21]/50 border border-[#2A3942]/60">
              <Shield className="w-4 h-4 text-[#00A884]" />
              <div className="flex-1">
                <p className="font-semibold">Privacy & Security</p>
                <p className="text-[11px] text-[#8696A0]">Supabase Auth & Unique Handles</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl text-xs text-[#E9EDEF] bg-[#111B21]/50 border border-[#2A3942]/60">
              <Bell className="w-4 h-4 text-[#00A884]" />
              <div className="flex-1">
                <p className="font-semibold">Notifications</p>
                <p className="text-[11px] text-[#8696A0]">Real-time message updates active</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl text-xs text-[#E9EDEF] bg-[#111B21]/50 border border-[#2A3942]/60">
              <Info className="w-4 h-4 text-[#00A884]" />
              <div className="flex-1">
                <p className="font-semibold">About Application</p>
                <p className="text-[11px] text-[#8696A0]">rucked Workspace Messenger</p>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          {onSignOut && (
            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
