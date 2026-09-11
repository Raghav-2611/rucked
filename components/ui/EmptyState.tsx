'use client';

import React from 'react';
import { MessageSquarePlus, MessageSquare, FolderPlus } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-topics' | 'no-statements' | 'no-selection';
  onCreateTopic?: () => void;
}

export function EmptyState({ type, onCreateTopic }: EmptyStateProps) {
  if (type === 'no-topics') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 h-full space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#00A884]/10 text-[#00A884] flex items-center justify-center border border-[#00A884]/20">
          <FolderPlus className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[#E9EDEF]">No topics yet</h3>
          <p className="text-sm text-[#8696A0] max-w-xs">
            Create your first topic to start logging your thoughts, updates, and observations.
          </p>
        </div>
        {onCreateTopic && (
          <button
            onClick={onCreateTopic}
            className="px-4 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#008f70] text-white font-medium text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-[#00A884]/20"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Create First Topic
          </button>
        )}
      </div>
    );
  }

  if (type === 'no-statements') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 h-full space-y-3 my-auto">
        <div className="w-16 h-16 rounded-full bg-[#202C33] text-[#00A884] flex items-center justify-center border border-[#2A3942] shadow-md">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h4 className="text-base font-semibold text-[#E9EDEF]">No messages yet</h4>
          <p className="text-xs text-[#8696A0]">
            Send a message below to start the conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full space-y-4 bg-[#0B141A]">
      <div className="w-20 h-20 rounded-full bg-[#202C33] text-[#00A884] flex items-center justify-center border border-[#2A3942] shadow-xl">
        <MessageSquare className="w-10 h-10" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-xl font-bold text-[#E9EDEF]">Welcome to rucked</h2>
        <p className="text-sm text-[#8696A0] leading-relaxed">
          Select a chat from the panel or start a new conversation to begin messaging.
        </p>
      </div>
    </div>
  );
}

