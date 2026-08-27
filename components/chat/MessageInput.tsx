'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal, Lock } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  disabledReason?: string;
}

export function MessageInput({ onSend, disabled = false, disabledReason }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [content]);

  const handleSend = async () => {
    if (!content.trim() || isSending || disabled) return;
    try {
      setIsSending(true);
      const textToSubmit = content.trim();
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      await onSend(textToSubmit);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (disabled) {
    return (
      <div
        className="p-3 bg-[#202C33] border-t border-[#2A3942] z-10"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 bg-[#111B21] border border-[#2A3942] rounded-2xl px-4 py-3 text-xs text-[#8696A0]">
          <Lock className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>{disabledReason || 'You have read-only access to this topic.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-3 bg-[#202C33] border-t border-[#2A3942] z-10"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-4xl mx-auto flex items-end gap-2 bg-[#111B21] border border-[#2A3942] focus-within:border-[#00A884] rounded-2xl px-4 py-2 transition-colors">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a statement, thought, or idea... (Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none resize-none py-1.5 max-h-40 min-h-[36px]"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || isSending || !content.trim()}
          className="p-2.5 rounded-full bg-[#00A884] hover:bg-[#008f70] text-white transition-all disabled:opacity-30 disabled:hover:bg-[#00A884] shrink-0 mb-0.5 shadow-md hover:shadow-[#00A884]/20 cursor-pointer"
          title="Send Statement"
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
