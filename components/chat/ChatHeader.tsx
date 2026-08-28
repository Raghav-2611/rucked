'use client';

import React, { useState } from 'react';
import { TopicWithPreview, Role, Profile } from '@/lib/types';
import { MemberModal } from './MemberModal';
import { CallButton } from '../call/CallButton';
import { ArrowLeft, Edit2, Trash2, Users, User, Share2, Eye } from 'lucide-react';

interface ChatHeaderProps {
  topic: TopicWithPreview;
  statementCount: number;
  onBackMobile?: () => void;
  onRenameTopic: () => void;
  onDeleteTopic: () => void;
  currentUser?: any;
  currentProfile?: Profile | null;
  onMemberAdded?: () => void;
}

export function ChatHeader({
  topic,
  statementCount,
  onBackMobile,
  onRenameTopic,
  onDeleteTopic,
  currentProfile,
  onMemberAdded,
}: ChatHeaderProps) {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const displayTitle = topic.is_group
    ? topic.title
    : (topic.dm_peer?.display_name || topic.dm_peer?.username || topic.title);

  const myRole: Role = topic.myRole || 'admin';
  const isAdmin = myRole === 'admin';
  const isViewer = myRole === 'view';

  const memberCount = topic.members?.length || 0;
  const subtitle = isViewer
    ? 'Read-only access'
    : memberCount > 1
    ? `${memberCount} members`
    : topic.is_group
    ? 'Group Chat'
    : 'Personal Topic';

  const participantName = currentProfile?.username || 'user';
  const displayName = currentProfile?.display_name || currentProfile?.username || 'user';

  return (
    <>
      <div className="bg-[#202C33] border-b border-[#2A3942] z-10 shadow-sm flex flex-col">
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

            {/* Avatar */}
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#E9EDEF] truncate tracking-tight">
                  {displayTitle}
                </h2>
                {isViewer && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 shrink-0">
                    <Eye className="w-3 h-3" /> Viewer
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8696A0] truncate max-w-[200px] sm:max-w-md">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Call buttons (non-viewers only) */}
            {!isViewer && (
              <CallButton
                topicId={topic.id}
                topicTitle={displayTitle}
                participantName={participantName}
                displayName={displayName}
                disabled={isViewer}
              />
            )}

            {/* Members button */}
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="p-2 text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Manage Members & Permissions"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Members</span>
              {memberCount > 0 && (
                <span className="bg-[#00A884]/20 text-[#00A884] px-1.5 rounded-full text-[10px]">
                  {memberCount}
                </span>
              )}
            </button>

            {/* Rename (Admins only) */}
            {isAdmin && (
              <button
                onClick={onRenameTopic}
                className="p-2 text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Rename Topic"
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden sm:inline">Rename</span>
              </button>
            )}

            {/* Delete (Admins only) */}
            {isAdmin && (
              <button
                onClick={onDeleteTopic}
                className="p-2 text-[#8696A0] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Delete Topic"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members Modal */}
      <MemberModal
        isOpen={isMemberModalOpen}
        topicId={topic.id}
        members={topic.members || []}
        myRole={myRole}
        onClose={() => setIsMemberModalOpen(false)}
        onMembersUpdated={() => {
          if (onMemberAdded) onMemberAdded();
        }}
      />
    </>
  );
}
