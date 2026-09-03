'use client';

import React, { useState } from 'react';
import { Statement } from '@/lib/types';
import { formatStatementTimestamp } from '@/lib/utils';
import { Edit2, Trash2, Check, X, Copy, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  statement: Statement;
  isOwn?: boolean;
  showSenderName?: boolean;
  onEdit: (statementId: string, newContent: string) => Promise<void> | void;
  onDelete: (statementId: string) => Promise<void> | void;
}

export function MessageBubble({
  statement,
  isOwn = false,
  showSenderName = false,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(statement.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const timestamp = formatStatementTimestamp(statement.created_at);

  const isEditable = React.useMemo(() => {
    if (!statement.created_at) return true;
    const createdAtTime = new Date(statement.created_at).getTime();
    const now = Date.now();
    const ONE_HOUR_MS = 60 * 60 * 1000;
    return now - createdAtTime < ONE_HOUR_MS;
  }, [statement.created_at]);

  const senderName =
    statement.sender?.display_name || statement.sender?.username || 'Member';

  const handleCopy = () => {
    navigator.clipboard.writeText(statement.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className={`flex mb-2 group animate-in fade-in duration-150 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm space-y-1 transition-all ${
          isOwn
            ? 'bg-[#005C4B] text-[#E9EDEF] border border-[#006052]/60 rounded-tr-xs'
            : 'bg-[#202C33] text-[#E9EDEF] border border-[#2A3942]/60 rounded-tl-xs hover:border-[#2A3942]'
        }`}
      >
        {/* Sender Name */}
        {showSenderName && !isOwn && (
          <p className="text-[11px] font-bold text-[#00A884] mb-0.5">
            {senderName}
          </p>
        )}

        {/* Message Action Toolbar (Hover on Desktop, Always accessible) */}
        {!isEditing && (
          <div
            className={`absolute top-1.5 ${
              isOwn ? 'left-1.5' : 'right-1.5'
            } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#111B21]/95 rounded-lg p-1 border border-[#2A3942] backdrop-blur-xs shadow-md z-10`}
          >
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-[#8696A0] hover:text-[#00A884] transition-colors cursor-pointer"
              title="Copy statement"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-[#00A884]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Edit & Delete (Own messages only) */}
            {isOwn && (
              <>
                {isEditable && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditContent(statement.content);
                      setIsEditing(true);
                    }}
                    className="p-1 text-[#8696A0] hover:text-[#00A884] transition-colors cursor-pointer"
                    title="Edit statement"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(statement.id)}
                  className="p-1 text-[#8696A0] hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete statement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
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
          <div className="text-sm font-normal text-[#E9EDEF] whitespace-pre-wrap leading-relaxed break-words pr-2">
            {statement.content}
          </div>
        )}

        {/* Timestamp */}
        <div className={`flex items-center gap-1.5 text-[10px] text-[#8696A0] pt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span>{timestamp}</span>
        </div>
      </div>
    </div>
  );
}
