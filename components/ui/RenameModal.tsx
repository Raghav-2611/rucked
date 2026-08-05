'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, X } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  initialTitle: string;
  onSave: (newTitle: string) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RenameModal({
  isOpen,
  initialTitle,
  onSave,
  onCancel,
  isLoading = false,
}: RenameModalProps) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <form
        onSubmit={handleSubmit}
        className="bg-[#202C33] border border-[#2A3942] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#E9EDEF]">
            <Edit3 className="w-5 h-5 text-[#00A884]" />
            <h3 className="text-lg font-semibold">Rename Topic</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#8696A0] hover:text-[#E9EDEF] p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#8696A0]">Topic Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter topic title..."
            autoFocus
            className="w-full bg-[#111B21] border border-[#2A3942] rounded-lg px-4 py-2.5 text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884] transition-colors"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[#E9EDEF] bg-[#111B21] hover:bg-[#2A3942] rounded-lg transition-colors border border-[#2A3942]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#00A884] hover:bg-[#008f70] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Title'}
          </button>
        </div>
      </form>
    </div>
  );
}
