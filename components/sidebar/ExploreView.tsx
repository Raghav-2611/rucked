'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, Topic, TopicWithPreview, TopicMember } from '@/lib/types';
import { Search, AtSign, User, MessageSquare, ArrowLeft, Globe, Lock, Loader2, Sparkles, Share2, Check } from 'lucide-react';

interface ExploreViewProps {
  onSelectTopic: (topic: TopicWithPreview) => void;
  activeTopicId: string | null;
  onOpenTopic?: (topicId: string) => void;
  initialTag?: string;
}

export function ExploreView({
  onSelectTopic,
  activeTopicId,
  initialTag = '',
}: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialTag);
  const [matchingProfiles, setMatchingProfiles] = useState<Profile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Selected Profile state
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [userTopics, setUserTopics] = useState<TopicWithPreview[]>([]);
  const [isLoadingUserTopics, setIsLoadingUserTopics] = useState(false);
  const [copiedProfileTag, setCopiedProfileTag] = useState(false);

  // Suggested profiles when search query is empty
  const [suggestedProfiles, setSuggestedProfiles] = useState<Profile[]>([]);
  const [isLoadingSuggested, setIsLoadingSuggested] = useState(false);

  // Fetch suggested profiles on mount
  useEffect(() => {
    const fetchSuggested = async () => {
      setIsLoadingSuggested(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setSuggestedProfiles(data || []);
      setIsLoadingSuggested(false);
    };

    fetchSuggested();
  }, []);

  // Live profile search with debounce
  useEffect(() => {
    const trimmed = searchQuery.trim().replace(/^@/, '');
    if (!trimmed) {
      setMatchingProfiles([]);
      setIsSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
        .limit(15);

      if (!error && data) {
        setMatchingProfiles(data);
      } else {
        setMatchingProfiles([]);
      }
      setIsSearchingUsers(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // When a profile is clicked, fetch their public topics
  const handleSelectProfile = async (profile: Profile) => {
    setSelectedProfile(profile);
    setIsLoadingUserTopics(true);

    try {
      // Query topics created by this user that are public (or where is_public is true or null for legacy)
      const { data: topicsData, error } = await supabase
        .from('topics')
        .select('*')
        .eq('created_by', profile.id)
        .or('is_public.eq.true,is_public.is.null')
        .order('created_at', { ascending: false });

      if (error || !topicsData) {
        setUserTopics([]);
        setIsLoadingUserTopics(false);
        return;
      }

      // Enhance topics with statements preview and count
      const enhanced: TopicWithPreview[] = await Promise.all(
        topicsData.map(async (t: Topic) => {
          const { data: stmts } = await supabase
            .from('statements')
            .select('content, created_at')
            .eq('topic_id', t.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from('statements')
            .select('id', { count: 'exact', head: true })
            .eq('topic_id', t.id);

          const { data: membersData } = await supabase
            .from('topic_members')
            .select('topic_id, user_id, role, created_at, profiles(*)')
            .eq('topic_id', t.id);

          const formattedMembers: TopicMember[] = (membersData || []).map((m: any) => ({
            topic_id: m.topic_id,
            user_id: m.user_id,
            role: m.role || 'view',
            created_at: m.created_at,
            profile: m.profiles,
          }));

          const lastStmt = stmts?.[0];
          return {
            ...t,
            statementCount: count ?? 0,
            unreadCount: 0,
            lastStatementPreview: lastStmt?.content,
            lastActivityAt: lastStmt?.created_at ?? t.created_at,
            members: formattedMembers,
            myRole: 'view',
            dm_peer: null,
          };
        })
      );

      setUserTopics(enhanced);
    } catch (err) {
      console.error('Error fetching user public topics:', err);
      setUserTopics([]);
    } finally {
      setIsLoadingUserTopics(false);
    }
  };

  const handleCopyTag = (username: string) => {
    navigator.clipboard.writeText(`@${username}`);
    setCopiedProfileTag(true);
    setTimeout(() => setCopiedProfileTag(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#202C33] border-r border-[#2A3942] select-none">
      {/* Header */}
      <div className="p-3.5 bg-[#202C33] border-b border-[#2A3942] shrink-0">
        {selectedProfile ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedProfile(null)}
              className="p-1.5 -ml-1 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21]/50 rounded-lg transition-colors cursor-pointer"
              title="Back to search"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#E9EDEF] truncate">
                {selectedProfile.display_name || selectedProfile.username}
              </h2>
              <p className="text-[11px] text-[#00A884] font-medium truncate">
                @{selectedProfile.username}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00A884]" />
              <h2 className="text-sm font-bold text-[#E9EDEF] tracking-tight">
                Explore Public Topics
              </h2>
            </div>
            <p className="text-[11px] text-[#8696A0] mt-0.5">
              Search creators by @tag and read their public chats
            </p>
          </div>
        )}
      </div>

      {/* If a profile is selected: Show their profile and their public topics */}
      {selectedProfile ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Profile Card */}
          <div className="p-4 bg-[#111B21] border border-[#2A3942] rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 text-[#00A884] font-black text-lg flex items-center justify-center shrink-0">
                  {(selectedProfile.display_name?.[0] || selectedProfile.username[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#E9EDEF]">
                    {selectedProfile.display_name || selectedProfile.username}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-[#00A884] font-semibold">
                      @{selectedProfile.username}
                    </span>
                    <button
                      onClick={() => handleCopyTag(selectedProfile.username)}
                      className="p-1 text-[#8696A0] hover:text-[#E9EDEF] transition-colors rounded cursor-pointer"
                      title="Copy @tag"
                    >
                      {copiedProfileTag ? (
                        <Check className="w-3 h-3 text-[#00A884]" />
                      ) : (
                        <Share2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#2A3942]/60 flex items-center justify-between text-[11px] text-[#8696A0]">
              <span>Joined {new Date(selectedProfile.created_at).toLocaleDateString()}</span>
              <span className="bg-[#00A884]/15 text-[#00A884] px-2 py-0.5 rounded-full font-semibold">
                {userTopics.length} Public {userTopics.length === 1 ? 'Topic' : 'Topics'}
              </span>
            </div>
          </div>

          {/* Topics List Header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8696A0]">
              Public Chats
            </span>
          </div>

          {/* User's Public Topics */}
          {isLoadingUserTopics ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#8696A0]">
              <Loader2 className="w-6 h-6 animate-spin text-[#00A884]" />
              <span className="text-xs">Loading public topics…</span>
            </div>
          ) : userTopics.length === 0 ? (
            <div className="py-12 px-4 text-center bg-[#111B21]/50 border border-[#2A3942] rounded-2xl space-y-2">
              <MessageSquare className="w-8 h-8 text-[#8696A0] mx-auto opacity-50" />
              <p className="text-xs font-semibold text-[#E9EDEF]">No public topics yet</p>
              <p className="text-[11px] text-[#8696A0]">
                @{selectedProfile.username} hasn&apos;t published any public topics yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {userTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => onSelectTopic(topic)}
                  className={`p-3 bg-[#111B21] hover:bg-[#111B21]/90 border rounded-xl cursor-pointer transition-all ${
                    activeTopicId === topic.id
                      ? 'border-[#00A884] shadow-md shadow-[#00A884]/10 bg-[#111B21]'
                      : 'border-[#2A3942] hover:border-[#8696A0]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#E9EDEF] line-clamp-1">
                      {topic.title}
                    </h4>
                    <span className="text-[10px] bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/30 px-1.5 py-0.5 rounded font-semibold shrink-0">
                      Public
                    </span>
                  </div>

                  {topic.lastStatementPreview ? (
                    <p className="text-[11px] text-[#8696A0] line-clamp-2 mt-1">
                      {topic.lastStatementPreview}
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#8696A0] italic mt-1">
                      No messages yet
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2A3942]/40 text-[10px] text-[#8696A0]">
                    <span>{topic.statementCount} statements</span>
                    <span className="text-[#00A884] font-semibold hover:underline">
                      View Chat →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Search & Discovery View */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search Box */}
          <div className="p-3 border-b border-[#2A3942] shrink-0">
            <div className="relative">
              <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#00A884]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user tag (e.g. @raghav)..."
                autoFocus
                className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl pl-9 pr-8 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884] transition-colors"
              />
              {isSearchingUsers && (
                <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#00A884] animate-spin" />
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {searchQuery.trim() ? (
              matchingProfiles.length === 0 ? (
                !isSearchingUsers && (
                  <div className="text-center py-12 px-4 space-y-2">
                    <AtSign className="w-8 h-8 text-[#8696A0] mx-auto opacity-40" />
                    <p className="text-sm font-semibold text-[#E9EDEF]">No user found</p>
                    <p className="text-xs text-[#8696A0]">
                      No user tag matching &ldquo;{searchQuery}&rdquo;. Try another handle.
                    </p>
                  </div>
                )
              ) : (
                matchingProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#111B21]/60 hover:bg-[#111B21] border border-[#2A3942] hover:border-[#00A884]/40 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#00A884]/20 border border-[#00A884]/30 text-[#00A884] font-bold text-xs flex items-center justify-center shrink-0">
                        {(p.display_name?.[0] || p.username[0] || 'U').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#E9EDEF] group-hover:text-[#00A884] transition-colors truncate">
                          {p.display_name || p.username}
                        </p>
                        <p className="text-[11px] text-[#00A884] truncate">
                          @{p.username}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#8696A0] group-hover:text-[#E9EDEF] shrink-0 font-medium">
                      View Topics →
                    </span>
                  </button>
                ))
              )
            ) : (
              /* Suggested Users when not searching */
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 px-1 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#00A884]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8696A0]">
                    Discover Creators
                  </span>
                </div>

                {isLoadingSuggested ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[#00A884]" />
                  </div>
                ) : suggestedProfiles.length === 0 ? (
                  <p className="text-xs text-[#8696A0] text-center py-6">
                    No creators yet. Be the first to publish a public topic!
                  </p>
                ) : (
                  suggestedProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProfile(p)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#111B21]/60 hover:bg-[#111B21] border border-[#2A3942] hover:border-[#00A884]/40 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#00A884]/20 border border-[#00A884]/30 text-[#00A884] font-bold text-xs flex items-center justify-center shrink-0">
                          {(p.display_name?.[0] || p.username[0] || 'U').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#E9EDEF] group-hover:text-[#00A884] transition-colors truncate">
                            {p.display_name || p.username}
                          </p>
                          <p className="text-[11px] text-[#00A884] truncate">
                            @{p.username}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#8696A0] group-hover:text-[#00A884] shrink-0 font-medium">
                        See Topics →
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
