'use client';

import React, { useState } from 'react';
import { TopicMember, Role } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { X, UserPlus, Shield, Edit3, Eye, Trash2, Loader2 } from 'lucide-react';

interface MemberModalProps {
  isOpen: boolean;
  topicId: string;
  members: TopicMember[];
  myRole: Role;
  onClose: () => void;
  onMembersUpdated: () => void;
}

export function MemberModal({
  isOpen,
  topicId,
  members,
  myRole,
  onClose,
  onMembersUpdated,
}: MemberModalProps) {
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<Role>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAdmin = myRole === 'admin';

  const broadcastMemberChange = () => {
    const channel = supabase.channel('calls-global-channel');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'member-change',
          payload: { topicId },
        });
      }
    });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || isSubmitting || !isAdmin) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const targetUser = newUsername.trim().toLowerCase();
      // Search for profile (case-insensitive)
      const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', targetUser)
        .single();

      if (searchError || !profile) {
        throw new Error('User not found. Check the username.');
      }

      // Check if already member
      const alreadyMember = members.some((m) => m.user_id === profile.id);
      if (alreadyMember) {
        throw new Error('User is already a member of this topic.');
      }

      // Insert member with role
      const { error: insertError } = await supabase
        .from('topic_members')
        .insert([
          {
            topic_id: topicId,
            user_id: profile.id,
            role: newRole,
          },
        ]);

      if (insertError) throw insertError;

      setSuccessMsg(`Added @${profile.username} as ${newRole}`);
      setNewUsername('');
      onMembersUpdated();
      broadcastMemberChange();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!isAdmin) return;
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from('topic_members')
        .update({ role: newRole })
        .eq('topic_id', topicId)
        .eq('user_id', userId);

      if (error) throw error;
      onMembersUpdated();
      broadcastMemberChange();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update role.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!isAdmin) return;
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from('topic_members')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', userId);

      if (error) throw error;
      onMembersUpdated();
      broadcastMemberChange();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#202C33] border border-[#2A3942] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#2A3942] flex items-center justify-between bg-[#111B21]">
          <div>
            <h3 className="text-base font-bold text-[#E9EDEF]">Topic Members & Access</h3>
            <p className="text-xs text-[#8696A0]">
              {isAdmin ? 'Manage access permissions and invite members.' : 'View member access levels.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to Add Member (Admins Only) */}
        {isAdmin && (
          <div className="p-4 bg-[#111B21]/50 border-b border-[#2A3942]">
            <form onSubmit={handleAddMember} className="space-y-3">
              <label className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider block">
                Add New Member
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Username (e.g. john)"
                  className="flex-1 bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="bg-[#202C33] border border-[#2A3942] rounded-xl px-2 py-2 text-xs text-[#E9EDEF] focus:outline-none focus:border-[#00A884]"
                >
                  <option value="edit">Editor</option>
                  <option value="view">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting || !newUsername.trim()}
                  className="bg-[#00A884] hover:bg-[#008f70] disabled:opacity-50 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Add
                </button>
              </div>

              {errorMsg && <p className="text-xs text-red-400 font-medium">{errorMsg}</p>}
              {successMsg && <p className="text-xs text-[#00A884] font-medium">{successMsg}</p>}
            </form>
          </div>
        )}

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <p className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">
            Current Members ({members.length})
          </p>

          {members.length === 0 ? (
            <p className="text-xs text-[#8696A0] italic py-3 text-center">No additional members added yet.</p>
          ) : (
            members.map((member) => {
              const displayName = member.profile?.display_name || member.profile?.username || 'User';
              const username = member.profile?.username || 'user';

              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between bg-[#111B21] border border-[#2A3942] rounded-xl p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#00A884]/20 text-[#00A884] font-bold text-xs flex items-center justify-center shrink-0 border border-[#00A884]/30 select-none">
                      {displayName[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#E9EDEF] truncate">{displayName}</p>
                      <p className="text-[11px] text-[#8696A0] truncate">@{username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <>
                        <select
                          value={member.role || 'edit'}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value as Role)}
                          className="bg-[#202C33] border border-[#2A3942] rounded-lg px-2 py-1 text-xs text-[#E9EDEF] focus:outline-none focus:border-[#00A884]"
                        >
                          <option value="admin">Admin</option>
                          <option value="edit">Editor</option>
                          <option value="view">Viewer</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-1.5 text-[#8696A0] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#202C33] border border-[#2A3942] text-[#8696A0] font-medium capitalize flex items-center gap-1">
                        {member.role === 'admin' && <Shield className="w-3 h-3 text-[#00A884]" />}
                        {member.role === 'edit' && <Edit3 className="w-3 h-3 text-blue-400" />}
                        {member.role === 'view' && <Eye className="w-3 h-3 text-yellow-400" />}
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
