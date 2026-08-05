'use client';

import React from 'react';
import { TopicWithPreview } from '@/lib/types';
import { ArrowLeft, Edit2, Trash2, Hash } from 'lucide-react';

interface ChatHeaderProps {
  topic: TopicWithPreview;
  statementCount: number;
  onBackMobile?: () => void;
  onRenameTopic: () => void;
  onDeleteTopic: () => void;
}

export function ChatHeader({
  topic,
  statementCount,
  onBackMobile,
  onRenameTopic,
  onDeleteTopic,
}: ChatHeaderProps) {
  return (
    <div className="bg-[#202C33] border-b border-[#2A3942] px-4 py-3 flex items-center justify-between z-10 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        {onBackMobile && (
          <button
            onClick={onBackMobile}
            className="md:hidden p-2 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21] rounded-lg transition-colors"
            title="Back to topics"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="w-9 h-9 rounded-full bg-[#00A884]/20 text-[#00A884] flex items-center justify-center shrink-0 border border-[#00A884]/30">
          <Hash className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#E9EDEF] truncate tracking-tight">
            {topic.title}
          </h2>
          <p className="text-xs text-[#8696A0]">
            {statementCount} {statementCount === 1 ? 'statement' : 'statements'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onRenameTopic}
          className="p-2 text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Rename Topic"
        >
          <Edit2 className="w-4 h-4" />
          <span className="hidden sm:inline">Rename</span>
        </button>

        <button
          onClick={onDeleteTopic}
          className="p-2 text-[#8696A0] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Delete Topic"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
}
