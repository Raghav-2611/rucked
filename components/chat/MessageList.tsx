'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Statement } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { StatementListSkeleton } from '../ui/Skeletons';
import { EmptyState } from '../ui/EmptyState';
import { ArrowDown } from 'lucide-react';

interface MessageListProps {
  statements: Statement[];
  isLoading: boolean;
  onEditStatement: (id: string, content: string) => Promise<void> | void;
  onDeleteStatement: (id: string) => Promise<void> | void;
  currentUser?: any;
}

export function MessageList({
  statements,
  isLoading,
  onEditStatement,
  onDeleteStatement,
  currentUser,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Auto-scroll to bottom whenever statements list changes
  useEffect(() => {
    scrollToBottom(true);
  }, [statements]);

  // Track scroll position to toggle "Scroll to Bottom" button
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isFarFromBottom);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto chat-pattern">
        <StatementListSkeleton />
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto chat-pattern flex flex-col">
        <EmptyState type="no-statements" />
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 chat-pattern space-y-1.5 scroll-smooth"
      >
        {statements.map((statement, index) => {
          const isOwn = Boolean(
            currentUser?.id && statement.sender_id === currentUser.id
          );

          const prevStatement = statements[index - 1];
          const isSameAsPrev =
            prevStatement && prevStatement.sender_id === statement.sender_id;

          return (
            <MessageBubble
              key={statement.id}
              statement={statement}
              isOwn={isOwn}
              showSenderName={!isOwn && !isSameAsPrev}
              onEdit={onEditStatement}
              onDelete={onDeleteStatement}
            />
          );
        })}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-4 bg-[#202C33]/90 hover:bg-[#202C33] text-[#00A884] border border-[#00A884]/40 p-2.5 rounded-full shadow-lg transition-all animate-in fade-in cursor-pointer z-20"
          title="Scroll to latest messages"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
