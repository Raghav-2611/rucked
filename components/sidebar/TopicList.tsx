'use client';

import React, { useState } from 'react';
import { TopicWithPreview } from '@/lib/types';
import { TopicCard } from './TopicCard';
import { TopicListSkeleton } from '../ui/Skeletons';
import { EmptyState } from '../ui/EmptyState';
import { Search, Plus, X, NotebookPen } from 'lucide-react';

interface TopicListProps {
  topics: TopicWithPreview[];
  activeTopicId: string | null;
  onSelectTopic: (topic: TopicWithPreview) => void;
  onCreateTopic: (title: string) => Promise<void> | void;
  isLoading: boolean;
}

export function TopicList({
  topics,
  activeTopicId,
  onSelectTopic,
  onCreateTopic,
  isLoading,
}: TopicListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTopics = topics.filter((topic) => {
    const titleMatch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
    const previewMatch = topic.lastStatementPreview
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return titleMatch || previewMatch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreateTopic(newTopicTitle.trim());
      setNewTopicTitle('');
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#202C33] border-r border-[#2A3942]">
      {/* Top Header */}
      <div className="p-4 bg-[#202C33] border-b border-[#2A3942] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00A884] flex items-center justify-center text-white shadow-md shadow-[#00A884]/20">
              <NotebookPen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#E9EDEF]">rucked</h1>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="p-2 rounded-xl bg-[#00A884] hover:bg-[#008f70] text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md hover:shadow-[#00A884]/20 cursor-pointer"
            title="New Topic"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Topic</span>
          </button>
        </div>

        {/* Inline Create Form */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-2.5 bg-[#111B21] border border-[#00A884] rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between text-xs text-[#00A884] font-semibold">
              <span>Create New Topic</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-[#8696A0] hover:text-[#E9EDEF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Topic name (e.g., Docker, Daily Notes)..."
                autoFocus
                className="flex-1 bg-[#202C33] border border-[#2A3942] rounded-lg px-3 py-1.5 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newTopicTitle.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#00A884] hover:bg-[#008f70] rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics or notes..."
            className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl pl-9 pr-8 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-[#E9EDEF]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Topic Cards Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <TopicListSkeleton />
        ) : topics.length === 0 ? (
          <EmptyState type="no-topics" onCreateTopic={() => setIsCreating(true)} />
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <p className="text-sm font-medium text-[#E9EDEF]">No matching topics</p>
            <p className="text-xs text-[#8696A0]">Try searching for another keyword.</p>
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isActive={topic.id === activeTopicId}
              onSelect={onSelectTopic}
            />
          ))
        )}
      </div>
    </div>
  );
}
