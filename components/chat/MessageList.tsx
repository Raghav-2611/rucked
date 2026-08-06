'use client';

import React, { useEffect, useRef } from 'react';
import { Statement } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { StatementListSkeleton } from '../ui/Skeletons';
import { EmptyState } from '../ui/EmptyState';

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

  // Auto-scroll to bottom whenever statements change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [statements]);

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
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 chat-pattern space-y-1"
    >
      {statements.map((statement, index) => {
        const isOwn = currentUser
          ? statement.sender_id === currentUser.id
          : true; // In demo mode all messages are "own"

        // Detect if previous statement was from the same sender (for grouping)
        const prevStatement = statements[index - 1];
        const isSameAsPrev = prevStatement && prevStatement.sender_id === statement.sender_id;

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
  );
}

