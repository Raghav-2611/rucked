'use client';

import React, { useState } from 'react';
import { Statement } from '@/lib/types';
import { formatStatementTimestamp } from '@/lib/utils';
import { Edit2, Trash2, Check, X } from 'lucide-react';

interface MessageBubbleProps {
  statement: Statement;
  onEdit: (statementId: string, newContent: string) => Promise<void> | void;
  onDelete: (statementId: string) => Promise<void> | void;
}

export function MessageBubble({ statement, onEdit, onDelete }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(statement.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timestamp = formatStatementTimestamp(statement.created_at);

  const handleSaveEdit = async () => {
    if (!editContent.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onEdit(statement.id, editContent.trim());
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(statement.content);
    }
  };

  return (
    <div className="flex justify-start mb-3 group animate-in fade-in duration-150">
      <div className="relative max-w-[88%] sm:max-w-[75%] bg-[#202C33] text-[#E9EDEF] border border-[#2A3942]/60 rounded-2xl rounded-tl-xs p-3.5 shadow-md space-y-1.5 transition-all hover:border-[#2A3942]">
        {/* Actions Dropdown / Hover Buttons */}
        {!isEditing && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#111B21]/90 rounded-lg p-1 border border-[#2A3942] backdrop-blur-xs">
            <button
              onClick={() => {
                setEditContent(statement.content);
                setIsEditing(true);
              }}
              className="p-1 text-[#8696A0] hover:text-[#00A884] transition-colors"
              title="Edit statement"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(statement.id)}
              className="p-1 text-[#8696A0] hover:text-red-400 transition-colors"
              title="Delete statement"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content or Edit Form */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full bg-[#111B21] border border-[#00A884] rounded-lg p-2 text-sm text-[#E9EDEF] focus:outline-none resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(statement.content);
                }}
                className="p-1.5 rounded-md text-[#8696A0] hover:bg-[#111B21] transition-colors text-xs flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editContent.trim()}
                className="px-2.5 py-1 rounded-md bg-[#00A884] text-white hover:bg-[#008f70] transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm font-normal text-[#E9EDEF] whitespace-pre-wrap leading-relaxed break-words pr-8">
            {statement.content}
          </div>
        )}

        {/* Timestamp */}
        <div className="flex justify-end items-center gap-1.5 text-[10px] text-[#8696A0] pt-1">
          <span>{timestamp}</span>
        </div>
      </div>
    </div>
  );
}
