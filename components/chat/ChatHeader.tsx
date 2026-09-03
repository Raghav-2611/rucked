'use client';

import React, { useState } from 'react';
import { TopicWithPreview, Role, Profile } from '@/lib/types';
import { MemberModal } from './MemberModal';
import { CallButton } from '../call/CallButton';
import { ArrowLeft, Edit2, Trash2, Users, User, Share2, Eye, Video, Phone } from 'lucide-react';

interface ChatHeaderProps {
  topic: TopicWithPreview;
  statementCount: number;
  onBackMobile?: () => void;
  onRenameTopic: () => void;
  onDeleteTopic: () => void;
  currentUser?: any;
  currentProfile?: Profile | null;
  onMemberAdded?: () => void;
  isCallActive?: boolean;
  activeCallMode?: 'voice' | 'video';
  onCallStateChange?: (isActive: boolean, mode: 'voice' | 'video') => void;
}

export function ChatHeader({
  topic,
  statementCount,
  onBackMobile,
  onRenameTopic,
  onDeleteTopic,
  currentProfile,
  onMemberAdded,
  isCallActive = false,
  activeCallMode = 'video',
  onCallStateChange,
}: ChatHeaderProps) {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [externalCallMode, setExternalCallMode] = useState<'voice' | 'video' | null>(null);

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

  const handleJoinCall = (mode: 'voice' | 'video') => {
    setExternalCallMode(mode);
    // Reset after trigger so it can be re-triggered if needed
    setTimeout(() => setExternalCallMode(null), 500);
  };

  return (
    <>
      <div className="sticky top-0 bg-[#202C33] border-b border-[#2A3942] z-10 shadow-sm flex flex-col shrink-0">
        {/* Live Call Banner */}
        {isCallActive && (
          <div className="bg-[#00A884]/20 border-b border-[#00A884]/40 px-4 py-2 flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#00A884]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A884] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00A884]" />
              </span>
              <span>
                {activeCallMode === 'voice' ? 'Voice Call' : 'Video Call'} in progress in this chat
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleJoinCall('voice')}
                className="bg-[#202C33] hover:bg-[#111B21] text-[#00A884] border border-[#00A884]/50 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                title="Join Voice Call"
              >
                <Phone className="w-3.5 h-3.5" /> Join Voice
              </button>
              <button
                onClick={() => handleJoinCall('video')}
                className="bg-[#00A884] hover:bg-[#008f70] text-white text-xs font-bold px-3 py-1 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer"
                title="Join Video Call"
              >
                <Video className="w-3.5 h-3.5" /> Join Video
              </button>
            </div>
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {onBackMobile && (
              <button
                onClick={onBackMobile}
                className="md:hidden p-2 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21] rounded-lg transition-colors cursor-pointer"
                title="Back to topics"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#00A884]/20 text-[#00A884] flex items-center justify-center shrink-0 border border-[#00A884]/30 font-bold text-sm select-none">
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
                onCallStateChange={onCallStateChange}
                externalActiveMode={externalCallMode}
              />
            )}

            {/* Members button */}
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="p-2 text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
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
                className="p-2 text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
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
                className="p-2 text-[#8696A0] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
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
