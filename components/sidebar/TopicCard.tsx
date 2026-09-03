'use client';

import React from 'react';
import { TopicWithPreview } from '@/lib/types';
import { formatTopicTimestamp } from '@/lib/utils';
import { Users, User, Phone } from 'lucide-react';

interface TopicCardProps {
  topic: TopicWithPreview;
  isActive: boolean;
  isCallActive?: boolean;
  onSelect: (topic: TopicWithPreview) => void;
}

export function TopicCard({ topic, isActive, isCallActive = false, onSelect }: TopicCardProps) {
  const timestamp = formatTopicTimestamp(topic.lastActivityAt || topic.created_at);

  const displayTitle = topic.is_group
    ? topic.title
    : (topic.dm_peer?.display_name || topic.dm_peer?.username || topic.title);

  const initial = displayTitle?.[0]?.toUpperCase() || '?';
  const unreadCount = topic.unreadCount || 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(topic)}
      className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center gap-3 border group cursor-pointer ${
        isActive
          ? 'bg-[#202C33] border-[#00A884] shadow-md shadow-[#00A884]/10'
          : 'bg-[#202C33]/40 hover:bg-[#202C33] border-transparent hover:border-[#2A3942]'
      }`}
    >
      {/* Icon / Initials */}
      <div className="relative shrink-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold text-sm ${
            isActive
              ? 'bg-[#00A884] text-white'
              : 'bg-[#2A3942] text-[#8696A0] group-hover:text-[#00A884] group-hover:bg-[#2A3942]/80'
          }`}
        >
          {topic.is_group ? (
            <Users className="w-5 h-5" />
          ) : topic.dm_peer ? (
            <span>{initial}</span>
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>

        {/* Active call badge */}
        {isCallActive && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00A884] rounded-full flex items-center justify-center ring-2 ring-[#202C33]">
            <Phone className="w-2.5 h-2.5 text-white animate-pulse" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className={`text-sm font-semibold truncate transition-colors ${
                isActive ? 'text-[#00A884]' : 'text-[#E9EDEF] group-hover:text-[#E9EDEF]'
              }`}
            >
              {displayTitle}
            </h3>
            {isCallActive && (
              <span className="shrink-0 text-[10px] font-semibold text-[#00A884] bg-[#00A884]/10 border border-[#00A884]/30 px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 bg-[#00A884] rounded-full" />
                Live
              </span>
            )}
          </div>
          {timestamp && (
            <span className={`text-[11px] font-medium shrink-0 ${unreadCount > 0 && !isActive ? 'text-[#00A884] font-bold' : 'text-[#8696A0]'}`}>
              {timestamp}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={`text-xs truncate ${unreadCount > 0 && !isActive ? 'text-[#E9EDEF] font-medium' : 'text-[#8696A0]'}`}>
            {isCallActive
              ? 'Call in progress...'
              : topic.lastStatementPreview
              ? topic.lastStatementPreview
              : 'No messages yet'}
          </p>

          {/* Unseen / Unread Chat Count Badge */}
          {unreadCount > 0 && !isActive && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00A884] text-white shrink-0 shadow-sm animate-in zoom-in-50 duration-150">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
