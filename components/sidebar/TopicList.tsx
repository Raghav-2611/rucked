'use client';

import React, { useState } from 'react';
import { TopicWithPreview, Profile } from '@/lib/types';
import { TopicCard } from './TopicCard';
import { TopicListSkeleton } from '../ui/Skeletons';
import { EmptyState } from '../ui/EmptyState';
import { Search, Plus, X, LogOut, MessageSquarePlus, FileText, UserPlus, Users } from 'lucide-react';

interface TopicListProps {
  topics: TopicWithPreview[];
  activeTopicId: string | null;
  onSelectTopic: (topic: TopicWithPreview) => void;
  onCreateTopic: (title: string, isGroup?: boolean, memberUsernames?: string[]) => Promise<void> | void;
  isLoading: boolean;
  currentProfile?: Profile | null;
  onSignOut?: () => void;
  activeCallTopicIds?: Set<string>;
}

export function TopicList({
  topics,
  activeTopicId,
  onSelectTopic,
  onCreateTopic,
  isLoading,
  currentProfile,
  onSignOut,
  activeCallTopicIds = new Set(),
}: TopicListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [creationMode, setCreationMode] = useState<'solo' | 'dm' | 'group'>('solo');
  
  // Solo topic field
  const [soloTitle, setSoloTitle] = useState('');
  
  // DM form fields
  const [peerUsername, setPeerUsername] = useState('');
  
  // Group form fields
  const [groupName, setGroupName] = useState('');
  const [groupMembersText, setGroupMembersText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTopics = topics.filter((topic) => {
    const title = topic.is_group 
      ? topic.title 
      : (topic.dm_peer?.display_name || topic.dm_peer?.username || topic.title);
    
    const titleMatch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const previewMatch = topic.lastStatementPreview
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return titleMatch || previewMatch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (creationMode === 'solo') {
        if (!soloTitle.trim()) return;
        await onCreateTopic(soloTitle.trim(), false, []);
        setSoloTitle('');
      } else if (creationMode === 'dm') {
        if (!peerUsername.trim()) return;
        const cleanedPeer = peerUsername.trim().toLowerCase();
        await onCreateTopic(cleanedPeer, false, [cleanedPeer]);
        setPeerUsername('');
      } else {
        if (!groupName.trim()) return;
        const membersList = groupMembersText
          .split(',')
          .map((m) => m.trim().toLowerCase())
          .filter((m) => m.length > 0);
        await onCreateTopic(groupName.trim(), true, membersList);
        setGroupName('');
        setGroupMembersText('');
      }
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#202C33] border-r border-[#2A3942]">
      {/* User Profile / Status Bar */}
      <div className="p-3 bg-[#202C33] flex items-center justify-between border-b border-[#2A3942]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00A884]/20 flex items-center justify-center border border-[#00A884]/30 text-[#00A884] font-extrabold text-lg select-none">
            {currentProfile?.display_name?.[0]?.toUpperCase() || currentProfile?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#E9EDEF] truncate">
              {currentProfile?.display_name || 'Loading user...'}
            </h2>
            <p className="text-[11px] text-[#8696A0] truncate">
              @{currentProfile?.username || 'user'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCreating(true)}
            className="p-2 rounded-lg text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21]/50 transition-all cursor-pointer"
            title="New Topic / Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg text-[#8696A0] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Action Bar (Search & Dynamic Create Form) */}
      <div className="p-3.5 space-y-3 border-b border-[#2A3942]">
        
        {/* Inline Create Form */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-3 bg-[#111B21] border border-[#00A884]/60 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg"
          >
            {/* Header Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCreationMode('solo')}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    creationMode === 'solo'
                      ? 'bg-[#202C33] text-[#00A884] border border-[#00A884]/30'
                      : 'text-[#8696A0] hover:text-[#E9EDEF]'
                  }`}
                >
                  <FileText className="w-3 h-3" /> Solo Topic
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('dm')}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    creationMode === 'dm'
                      ? 'bg-[#202C33] text-[#00A884] border border-[#00A884]/30'
                      : 'text-[#8696A0] hover:text-[#E9EDEF]'
                  }`}
                >
                  <UserPlus className="w-3 h-3" /> Direct DM
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('group')}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    creationMode === 'group'
                      ? 'bg-[#202C33] text-[#00A884] border border-[#00A884]/30'
                      : 'text-[#8696A0] hover:text-[#E9EDEF]'
                  }`}
                >
                  <Users className="w-3 h-3" /> Group
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-[#8696A0] hover:text-[#E9EDEF] p-1 rounded-lg hover:bg-[#202C33]/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {creationMode === 'solo' ? (
              // Solo Topic Input
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={soloTitle}
                  onChange={(e) => setSoloTitle(e.target.value)}
                  placeholder="Enter topic title (e.g. My Personal Journal)..."
                  autoFocus
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg px-3 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !soloTitle.trim()}
                  className="w-full py-1.5 text-xs font-bold text-white bg-[#00A884] hover:bg-[#008f70] rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Topic
                </button>
              </div>
            ) : creationMode === 'dm' ? (
              // Direct Message Inputs
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={peerUsername}
                  onChange={(e) => setPeerUsername(e.target.value)}
                  placeholder="Enter user handle/username (e.g. john)"
                  autoFocus
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg px-3 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !peerUsername.trim()}
                  className="w-full py-1.5 text-xs font-bold text-white bg-[#00A884] hover:bg-[#008f70] rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Start Chat
                </button>
              </div>
            ) : (
              // Group Chat Inputs
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group Name (e.g. Project Alpha)"
                  autoFocus
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg px-3 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                />
                <input
                  type="text"
                  value={groupMembersText}
                  onChange={(e) => setGroupMembersText(e.target.value)}
                  placeholder="Members (comma-separated usernames)..."
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg px-3 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !groupName.trim()}
                  className="w-full py-1.5 text-xs font-bold text-white bg-[#00A884] hover:bg-[#008f70] rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Group
                </button>
              </div>
            )}
          </form>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats or messages..."
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
            <p className="text-sm font-medium text-[#E9EDEF]">No matching chats</p>
            <p className="text-xs text-[#8696A0]">Try searching for another keyword.</p>
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isActive={topic.id === activeTopicId}
              isCallActive={activeCallTopicIds.has(topic.id)}
              onSelect={onSelectTopic}
            />
          ))
        )}
      </div>
    </div>
  );
}
