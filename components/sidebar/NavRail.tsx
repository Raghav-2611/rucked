'use client';

import React from 'react';
import { MessageSquare, Users, Phone, Settings } from 'lucide-react';

export type NavTab = 'all' | 'direct' | 'groups' | 'calls';

interface NavRailProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSettings: () => void;
  unreadTotal?: number;
  activeCallsCount?: number;
}

export function NavRail({
  activeTab,
  onTabChange,
  onOpenSettings,
  unreadTotal = 0,
  activeCallsCount = 0,
}: NavRailProps) {
  return (
    <div className="w-16 h-full bg-[#111B21] border-r border-[#2A3942] flex flex-col items-center justify-between py-4 shrink-0 z-20 select-none">
      {/* Top Navigation Stack */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Direct Chat / All */}
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'all' || activeTab === 'direct'
              ? 'bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40 shadow-sm'
              : 'text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33]/60'
          }`}
          title="Direct Chats & Messages"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00A884] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          )}
        </button>

        {/* Groups */}
        <button
          type="button"
          onClick={() => onTabChange('groups')}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'groups'
              ? 'bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40 shadow-sm'
              : 'text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33]/60'
          }`}
          title="Groups"
        >
          <Users className="w-5 h-5" />
        </button>

        {/* Calls */}
        <button
          type="button"
          onClick={() => onTabChange('calls')}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'calls'
              ? 'bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40 shadow-sm'
              : 'text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33]/60'
          }`}
          title="Calls & Active Sessions"
        >
          <Phone className="w-5 h-5" />
          {activeCallsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00A884] rounded-full ring-2 ring-[#111B21] animate-pulse" />
          )}
        </button>
      </div>

      {/* Bottom Settings Icon */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33]/60 transition-all cursor-pointer"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
