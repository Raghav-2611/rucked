'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Pencil, Check, X, Loader2, AtSign, User, Info } from 'lucide-react';

interface EditProfileViewProps {
  currentProfile?: Profile | null;
  onBackToSettings: () => void;
  onUpdateProfile: (updated: Profile) => void;
}

export function EditProfileView({
  currentProfile,
  onBackToSettings,
  onUpdateProfile,
}: EditProfileViewProps) {
  const [displayName, setDisplayName] = useState('');
  const [usernameTag, setUsernameTag] = useState('');
  const [aboutText, setAboutText] = useState('Available | Using rucked workspace');

  // Edit mode toggles
  const [editingField, setEditingField] = useState<'name' | 'tag' | 'about' | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.display_name || currentProfile.username || '');
      setUsernameTag(currentProfile.username || '');
    }
  }, [currentProfile]);

  const initial =
    currentProfile?.display_name?.[0]?.toUpperCase() ||
    currentProfile?.username?.[0]?.toUpperCase() ||
    'U';

  const handleSaveName = async () => {
    if (!currentProfile || isSaving) return;
    setError(null);
    setSuccess(null);

    const cleanedName = displayName.trim();
    if (!cleanedName) {
      setError('Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ display_name: cleanedName })
        .eq('id', currentProfile.id);

      if (updateErr) {
        setError(updateErr.message || 'Failed to update name.');
        setIsSaving(false);
        return;
      }

      const updated = { ...currentProfile, display_name: cleanedName };
      onUpdateProfile(updated);
      setEditingField(null);
      setSuccess('Name updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Error updating name.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTag = async () => {
    if (!currentProfile || isSaving) return;
    setError(null);
    setSuccess(null);

    const cleanedTag = usernameTag.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanedTag || cleanedTag.length < 3) {
      setError('Tag must be at least 3 characters (letters, numbers, underscores only).');
      return;
    }

    setIsSaving(true);
    try {
      // Uniqueness check
      if (cleanedTag !== currentProfile.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanedTag)
          .neq('id', currentProfile.id)
          .maybeSingle();

        if (existingUser) {
          setError(`The tag "@${cleanedTag}" is already taken by another user. Choose another.`);
          setIsSaving(false);
          return;
        }
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ username: cleanedTag })
        .eq('id', currentProfile.id);

      if (updateErr) {
        if (updateErr.code === '23505' || updateErr.message.includes('unique')) {
          setError(`The tag "@${cleanedTag}" is already taken.`);
        } else {
          setError(updateErr.message || 'Failed to update unique tag.');
        }
        setIsSaving(false);
        return;
      }

      const updated = { ...currentProfile, username: cleanedTag };
      onUpdateProfile(updated);
      setEditingField(null);
      setSuccess(`Unique tag updated to @${cleanedTag}!`);
    } catch (err: any) {
      setError(err?.message || 'Error updating tag.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#111B21] border-r border-[#2A3942] select-none overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-[#202C33] border-b border-[#2A3942] flex items-center gap-4 shrink-0 sticky top-0 z-10">
        <button
          type="button"
          onClick={onBackToSettings}
          className="p-1.5 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21] rounded-xl transition-colors cursor-pointer"
          title="Back to Settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-[#E9EDEF] tracking-tight">Edit profile</h1>
      </div>

      <div className="p-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Profile Image Centered */}
        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          <div className="relative group cursor-pointer">
            <div className="w-36 h-36 rounded-full bg-[#00A884]/20 border-2 border-[#00A884]/40 flex items-center justify-center text-[#00A884] font-extrabold text-5xl shadow-xl transition-transform group-hover:scale-105">
              {initial}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
              CHANGE PROFILE
            </div>
          </div>
        </div>

        {/* Global Notifications / Errors */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-[#00A884]/10 border border-[#00A884]/30 text-[#00A884] text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. Name Section */}
        <div className="p-4 bg-[#202C33] border border-[#2A3942] rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#8696A0] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#00A884]" />
              <span>Your name</span>
            </div>
            {editingField !== 'name' && (
              <button
                type="button"
                onClick={() => setEditingField('name')}
                className="p-1.5 text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors cursor-pointer"
                title="Edit Name"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {editingField === 'name' ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
                className="flex-1 bg-[#111B21] border border-[#00A884] rounded-xl px-3 py-2 text-sm text-[#E9EDEF] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isSaving}
                className="p-2 bg-[#00A884] text-white rounded-xl hover:bg-[#008f70] transition-colors cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="p-2 bg-[#111B21] text-[#8696A0] hover:text-[#E9EDEF] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-base font-semibold text-[#E9EDEF] pt-0.5">
              {currentProfile?.display_name || currentProfile?.username || 'Raghav Sharma'}
            </p>
          )}

          <p className="text-[11px] text-[#8696A0] leading-relaxed pt-1">
            This is not your username or pin. This name will be visible to your contacts.
          </p>
        </div>

        {/* 2. Unique Tag (@username) Section */}
        <div className="p-4 bg-[#202C33] border border-[#2A3942] rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#8696A0] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <AtSign className="w-4 h-4 text-[#00A884]" />
              <span>Unique Tag (@username)</span>
            </div>
            {editingField !== 'tag' && (
              <button
                type="button"
                onClick={() => setEditingField('tag')}
                className="p-1.5 text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors cursor-pointer"
                title="Edit Unique Tag"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {editingField === 'tag' ? (
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] font-bold text-sm">@</span>
                <input
                  type="text"
                  value={usernameTag}
                  onChange={(e) => setUsernameTag(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  autoFocus
                  className="w-full bg-[#111B21] border border-[#00A884] rounded-xl pl-8 pr-3 py-2 text-sm text-[#E9EDEF] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveTag}
                disabled={isSaving}
                className="p-2 bg-[#00A884] text-white rounded-xl hover:bg-[#008f70] transition-colors cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="p-2 bg-[#111B21] text-[#8696A0] hover:text-[#E9EDEF] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-base font-semibold text-[#00A884] pt-0.5">
              @{currentProfile?.username || 'username'}
            </p>
          )}

          <p className="text-[11px] text-[#8696A0] leading-relaxed pt-1">
            Unique tag used by colleagues and groups to reach you directly.
          </p>
        </div>

        {/* 3. About Section */}
        <div className="p-4 bg-[#202C33] border border-[#2A3942] rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#8696A0] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#00A884]" />
              <span>About</span>
            </div>
            {editingField !== 'about' && (
              <button
                type="button"
                onClick={() => setEditingField('about')}
                className="p-1.5 text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors cursor-pointer"
                title="Edit About"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {editingField === 'about' ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                autoFocus
                className="flex-1 bg-[#111B21] border border-[#00A884] rounded-xl px-3 py-2 text-sm text-[#E9EDEF] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="p-2 bg-[#00A884] text-white rounded-xl hover:bg-[#008f70] transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium text-[#E9EDEF] pt-0.5">
              {aboutText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
