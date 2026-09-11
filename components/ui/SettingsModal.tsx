'use client';

import React from 'react';
import { Profile } from '@/lib/types';
import { LogOut, X, Shield, Bell, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: Profile | null;
  onSignOut?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentProfile,
  onSignOut,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const initial = currentProfile?.display_name?.[0]?.toUpperCase() || currentProfile?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="bg-[#202C33] border border-[#2A3942] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#111B21] border-b border-[#2A3942] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#E9EDEF]">Settings</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
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

          {/* Settings Info Items */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl text-xs text-[#E9EDEF] bg-[#111B21]/50 border border-[#2A3942]/60">
              <Shield className="w-4 h-4 text-[#00A884]" />
              <div className="flex-1">
                <p className="font-semibold">Privacy & Security</p>
                <p className="text-[11px] text-[#8696A0]">Supabase Auth & Real-Time Sync</p>
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
