'use client';

import React from 'react';
import { TopicWithPreview } from '@/lib/types';
import { formatTopicTimestamp } from '@/lib/utils';
import { Users, User } from 'lucide-react';

interface TopicCardProps {
  topic: TopicWithPreview;
  isActive: boolean;
  onSelect: (topic: TopicWithPreview) => void;
}

export function TopicCard({ topic, isActive, onSelect }: TopicCardProps) {
  const timestamp = formatTopicTimestamp(topic.lastActivityAt || topic.created_at);

  // Resolve display title and avatar depending on DM or Group
  const displayTitle = topic.is_group
    ? topic.title
    : (topic.dm_peer?.display_name || topic.dm_peer?.username || topic.title);

  const initial = displayTitle?.[0]?.toUpperCase() || '?';

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
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors font-bold text-sm ${
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`text-sm font-semibold truncate transition-colors ${
              isActive ? 'text-[#00A884]' : 'text-[#E9EDEF] group-hover:text-[#E9EDEF]'
            }`}
          >
            {displayTitle}
          </h3>
          {timestamp && (
            <span className="text-[11px] font-medium text-[#8696A0] shrink-0">
              {timestamp}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-xs text-[#8696A0] truncate">
            {topic.lastStatementPreview ? topic.lastStatementPreview : 'No messages yet'}
          </p>

          {typeof topic.statementCount === 'number' && topic.statementCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                isActive
                  ? 'bg-[#00A884]/20 text-[#00A884]'
                  : 'bg-[#2A3942] text-[#8696A0]'
              }`}
            >
              {topic.statementCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
