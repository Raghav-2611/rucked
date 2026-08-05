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
}

export function MessageList({
  statements,
  isLoading,
  onEditStatement,
  onDeleteStatement,
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
      {statements.map((statement) => (
        <MessageBubble
          key={statement.id}
          statement={statement}
          onEdit={onEditStatement}
          onDelete={onDeleteStatement}
        />
      ))}
    </div>
  );
}
