'use client';

import React from 'react';
import { Profile } from '@/lib/types';
import {
  User,
  Shield,
  Lock,
  MessageSquare,
  Bell,
  Keyboard,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface SettingsViewProps {
  currentProfile?: Profile | null;
  onNavigateToProfile: () => void;
  onSignOut?: () => void;
}

export function SettingsView({
  currentProfile,
  onNavigateToProfile,
  onSignOut,
}: SettingsViewProps) {
  const initial =
    currentProfile?.display_name?.[0]?.toUpperCase() ||
    currentProfile?.username?.[0]?.toUpperCase() ||
    'U';

  return (
    <div className="flex flex-col h-full w-full bg-[#111B21] border-r border-[#2A3942] select-none overflow-y-auto">
      {/* Settings Header */}
      <div className="p-4 bg-[#202C33] border-b border-[#2A3942] shrink-0 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-[#E9EDEF] tracking-tight">Settings</h1>
      </div>

      <div className="p-3.5 space-y-4">
        {/* Profile Card Summary */}
        <button
          type="button"
          onClick={onNavigateToProfile}
          className="w-full p-3.5 bg-[#202C33] hover:bg-[#202C33]/80 border border-[#2A3942] rounded-2xl flex items-center gap-4 transition-all text-left group cursor-pointer shadow-sm"
        >
          <div className="w-14 h-14 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884] font-extrabold text-xl shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#E9EDEF] truncate group-hover:text-[#00A884] transition-colors">
              {currentProfile?.display_name || currentProfile?.username || 'User Profile'}
            </h2>
            <p className="text-xs text-[#8696A0] truncate mt-0.5">
              @{currentProfile?.username || 'username'}
            </p>
            <p className="text-[11px] text-[#00A884] mt-1 font-medium">
              Available | Click to edit profile
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8696A0] group-hover:text-[#E9EDEF] shrink-0 transition-colors" />
        </button>

        {/* Settings Options List */}
        <div className="space-y-1 bg-[#202C33] border border-[#2A3942] rounded-2xl p-1.5">
          {/* Profile */}
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#111B21] transition-colors text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#111B21] border border-[#2A3942] flex items-center justify-center text-[#00A884] group-hover:scale-105 transition-transform shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#E9EDEF] group-hover:text-[#00A884] transition-colors">
                Profile
              </p>
              <p className="text-xs text-[#8696A0] truncate">Name, profile picture, unique tag</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8696A0] shrink-0" />
          </button>

          {/* Account */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#111B21] transition-colors text-left group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#111B21] border border-[#2A3942] flex items-center justify-center text-[#00A884] shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#E9EDEF]">Account</p>
              <p className="text-xs text-[#8696A0] truncate">Security notifications, account info</p>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#111B21] transition-colors text-left group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#111B21] border border-[#2A3942] flex items-center justify-center text-[#00A884] shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#E9EDEF]">Privacy</p>
              <p className="text-xs text-[#8696A0] truncate">Blocked contacts, disappearing messages</p>
            </div>
          </div>

          {/* Chats */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#111B21] transition-colors text-left group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#111B21] border border-[#2A3942] flex items-center justify-center text-[#00A884] shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#E9EDEF]">Chats</p>
              <p className="text-xs text-[#8696A0] truncate">Theme, wallpaper, chat history</p>
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#111B21] transition-colors text-left group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#111B21] border border-[#2A3942] flex items-center justify-center text-[#00A884] shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#E9EDEF]">Notifications</p>
              <p className="text-xs text-[#8696A0] truncate">Messages, groups, call sounds</p>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#111B21] transition-colors text-left group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#111B21] border border-[#2A3942] flex items-center justify-center text-[#00A884] shrink-0">
              <Keyboard className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#E9EDEF]">Keyboard shortcuts</p>
              <p className="text-xs text-[#8696A0] truncate">Quick navigation actions</p>
            </div>
          </div>

          {/* Help and feedback */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#111B21] transition-colors text-left group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#111B21] border border-[#2A3942] flex items-center justify-center text-[#00A884] shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#E9EDEF]">Help and feedback</p>
              <p className="text-xs text-[#8696A0] truncate">Help centre, contact us, privacy policy</p>
            </div>
          </div>
        </div>

        {/* Log Out Button */}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="w-full p-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center gap-2 text-red-400 font-semibold text-sm transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        )}
      </div>
    </div>
  );
}
