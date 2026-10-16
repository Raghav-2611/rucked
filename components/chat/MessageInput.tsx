'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal, Lock, Globe, LogIn } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  disabledReason?: string;
  isGuest?: boolean;
  onAuthPrompt?: () => void;
}

export function MessageInput({
  onSend,
  disabled = false,
  disabledReason,
  isGuest = false,
  onAuthPrompt,
}: MessageInputProps) {
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

  if (isGuest) {
    return (
      <div
        className="p-2.5 sm:p-3 bg-[#202C33] border-t border-[#2A3942] z-20 shrink-0 sticky bottom-0 w-full"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-[#111B21] border border-[#00A884]/40 rounded-2xl px-4 py-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-[#E9EDEF]">
            <Globe className="w-4 h-4 text-[#00A884] shrink-0" />
            <span>You are viewing this chat as a guest.</span>
          </div>
          {onAuthPrompt && (
            <button
              onClick={onAuthPrompt}
              className="bg-[#00A884] hover:bg-[#008f70] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log in or Sign up to chat & call</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <div
        className="p-2.5 sm:p-3 bg-[#202C33] border-t border-[#2A3942] z-20 shrink-0 sticky bottom-0 w-full"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
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
      className="p-2.5 sm:p-3 bg-[#202C33] border-t border-[#2A3942] z-20 shrink-0 sticky bottom-0 w-full"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-4xl mx-auto flex items-end gap-2 bg-[#111B21] border border-[#2A3942] focus-within:border-[#00A884] rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 transition-colors shadow-lg">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none resize-none py-1.5 max-h-36 min-h-[36px]"
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
