'use client';

import React, { useState } from 'react';
import { TopicWithPreview, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Edit2, Trash2, Users, User, UserPlus, X, Check, Loader2 } from 'lucide-react';

interface ChatHeaderProps {
  topic: TopicWithPreview;
  statementCount: number;
  onBackMobile?: () => void;
  onRenameTopic: () => void;
  onDeleteTopic: () => void;
  currentUser?: any;
  onMemberAdded?: () => void;
}

export function ChatHeader({
  topic,
  statementCount,
  onBackMobile,
  onRenameTopic,
  onDeleteTopic,
  currentUser,
  onMemberAdded,
}: ChatHeaderProps) {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Determine display title
  const displayTitle = topic.is_group
    ? topic.title
    : (topic.dm_peer?.display_name || topic.dm_peer?.username || topic.title);

  // Construct display subtitle (list of members or message count)
  let subtitle = '';
  if (topic.is_group && topic.members && currentUser) {
    const memberNames = topic.members.map((m) => {
      if (m.user_id === currentUser.id) return 'You';
      return m.profile?.display_name || m.profile?.username || 'user';
    });
    subtitle = memberNames.join(', ');
  } else {
    subtitle = topic.is_group ? 'Group Chat' : 'Direct Message';
  }

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberUsername.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      // 1. Find user by username
      const targetUser = newMemberUsername.trim().toLowerCase();
      const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', targetUser)
        .single();

      if (searchError || !profile) {
        throw new Error('User not found. Double check the username.');
      }

      // Check if they are already in the group
      const alreadyMember = topic.members?.some(m => m.user_id === profile.id);
      if (alreadyMember) {
        throw new Error('User is already a member of this chat.');
      }

      // 2. Add member to topic_members
      const { error: insertError } = await supabase
        .from('topic_members')
        .insert([{ topic_id: topic.id, user_id: profile.id }]);

      if (insertError) throw insertError;

      setMessage({ text: `Successfully added @${profile.username}!`, isError: false });
      setNewMemberUsername('');
      
      // Refresh parent topics
      if (onMemberAdded) {
        onMemberAdded();
      }

      // Auto close after 1.5 seconds
      setTimeout(() => {
        setIsAddingMember(false);
        setMessage(null);
      }, 1500);

    } catch (err: any) {
      setMessage({ text: err.message || 'Error adding member.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#202C33] border-b border-[#2A3942] z-10 shadow-sm flex flex-col">
      {/* Top Main Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-2 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21] rounded-lg transition-colors"
              title="Back to topics"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar Icon */}
          <div className="w-10 h-10 rounded-full bg-[#00A884]/20 text-[#00A884] flex items-center justify-center shrink-0 border border-[#00A884]/30 font-bold text-sm">
            {topic.is_group ? (
              <Users className="w-5 h-5" />
            ) : topic.dm_peer ? (
              <span>{displayTitle[0]?.toUpperCase()}</span>
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#E9EDEF] truncate tracking-tight">
              {displayTitle}
            </h2>
            <p className="text-xs text-[#8696A0] truncate max-w-[200px] sm:max-w-md">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Add member button (Only for groups) */}
          {topic.is_group && (
            <button
              onClick={() => {
                setIsAddingMember(!isAddingMember);
                setMessage(null);
              }}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                isAddingMember 
                  ? 'text-[#00A884] bg-[#00A884]/15' 
                  : 'text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21]'
              }`}
              title="Add Member"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>
          )}

          <button
            onClick={onRenameTopic}
            className="p-2 text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Rename Topic"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Rename</span>
          </button>

          <button
            onClick={onDeleteTopic}
            className="p-2 text-[#8696A0] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Delete Topic"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Add Member Drawer Form */}
      {isAddingMember && (
        <div className="px-4 py-3 bg-[#111B21] border-t border-[#2A3942] animate-in slide-in-from-top duration-150">
          <form onSubmit={handleAddMemberSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMemberUsername}
                onChange={(e) => setNewMemberUsername(e.target.value)}
                placeholder="Enter member's username to add..."
                className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg px-3 py-1.5 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                autoFocus
              />
            </div>
            <div className="flex gap-1.5 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAddingMember(false);
                  setMessage(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-[#8696A0] hover:bg-[#202C33] rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newMemberUsername.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#00A884] hover:bg-[#008f70] rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Add
              </button>
            </div>
          </form>

          {message && (
            <p className={`text-[11px] font-semibold mt-2 ${message.isError ? 'text-red-400' : 'text-[#00A884]'}`}>
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
