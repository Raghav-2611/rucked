"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Topic, Statement, TopicWithPreview, Profile, TopicMember, Role } from '@/lib/types';
import { TopicList } from '@/components/sidebar/TopicList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RenameModal } from '@/components/ui/RenameModal';
import { Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function HomePage() {
  const router = useRouter();

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Data state
  const [topics, setTopics] = useState<TopicWithPreview[]>([]);
  const [activeTopic, setActiveTopic] = useState<TopicWithPreview | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);

  // UI state
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingStatements, setIsLoadingStatements] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Active calls — tracks which topic IDs have a live call via Supabase Realtime
  const [activeCallTopicIds, setActiveCallTopicIds] = useState<Set<string>>(new Set());

  // Modal state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessingModal, setIsProcessingModal] = useState(false);

  // ─── Auth Guard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth');
        return;
      }

      setCurrentUser(session.user);

      // Fetch profile (username)
      let currentProf: Profile | null = null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        currentProf = profile;
      } else {
        // Fallback: create profile if DB trigger was skipped
        const fallbackUsername = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user';
        currentProf = {
          id: session.user.id,
          username: fallbackUsername,
          display_name: session.user.user_metadata?.display_name || fallbackUsername,
          avatar_url: session.user.user_metadata?.avatar_url || null,
          created_at: session.user.created_at || new Date().toISOString(),
        };
        await supabase.from('profiles').upsert([currentProf], { onConflict: 'id' });
      }

      setCurrentProfile(currentProf);
      setIsLoadingAuth(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // ─── Active Call Realtime Tracking ───────────────────────────────────────────

  useEffect(() => {
    const channel = supabase.channel('active-calls');
    channel
      .on('broadcast', { event: 'call-state' }, ({ payload }) => {
        const { topicId, isActive } = payload as { topicId: string; isActive: boolean };
        setActiveCallTopicIds((prev) => {
          const next = new Set(prev);
          if (isActive) next.add(topicId);
          else next.delete(topicId);
          return next;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ─── Fetch Topics ───────────────────────────────────────────────────────────

  const fetchTopics = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingTopics(true);

    const { data: topicsData, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching topics:', error.message, error.details, error.hint, error.code);
      setIsLoadingTopics(false);
      return;
    }

    // Enhance topics with preview, statement count, members, and myRole
    const enhanced: TopicWithPreview[] = await Promise.all(
      (topicsData || []).map(async (t: Topic) => {
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

        // Fetch members with profiles
        const { data: membersData } = await supabase
          .from('topic_members')
          .select('topic_id, user_id, role, created_at, profiles(*)')
          .eq('topic_id', t.id);

        const formattedMembers: TopicMember[] = (membersData || []).map((m: any) => ({
          topic_id: m.topic_id,
          user_id: m.user_id,
          role: m.role || 'edit',
          created_at: m.created_at,
          profile: m.profiles,
        }));

        // Determine current user's role
        let myRole: Role = 'admin';
        const myMemberRecord = formattedMembers.find((m) => m.user_id === currentUser.id);
        if (myMemberRecord) {
          myRole = myMemberRecord.role;
        } else if (t.created_by && t.created_by !== currentUser.id) {
          myRole = 'edit';
        }

        const lastStmt = stmts?.[0];
        return {
          ...t,
          statementCount: count ?? 0,
          lastStatementPreview: lastStmt?.content,
          lastActivityAt: lastStmt?.created_at ?? t.created_at,
          members: formattedMembers,
          myRole,
          dm_peer: null,
        };
      })
    );

    enhanced.sort((a, b) => {
      const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
      const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
      return timeB - timeA;
    });

    setTopics(enhanced);

    // Keep current active topic updated with fresh data if present
    if (activeTopic) {
      const updatedActive = enhanced.find((t) => t.id === activeTopic.id);
      if (updatedActive) setActiveTopic(updatedActive);
    } else if (enhanced.length > 0) {
      setActiveTopic(enhanced[0]);
    }

    setIsLoadingTopics(false);
  }, [currentUser, activeTopic]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingAuth, currentUser]);

  // ─── Fetch Statements ───────────────────────────────────────────────────────

  const fetchStatements = useCallback(async (topicId: string) => {
    setIsLoadingStatements(true);

    const { data, error } = await supabase
      .from('statements')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching statements:', error);
    } else {
      setStatements(data || []);
    }

    setIsLoadingStatements(false);
  }, []);

  useEffect(() => {
    if (activeTopic) fetchStatements(activeTopic.id);
    else setStatements([]);
  }, [activeTopic, fetchStatements]);

  const chatChannelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activeTopicRef = React.useRef<TopicWithPreview | null>(null);

  useEffect(() => {
    activeTopicRef.current = activeTopic;
  }, [activeTopic]);

  // ─── Realtime Subscriptions (Broadcast & Postgres Changes) ─────────────────

  useEffect(() => {
    if (!currentUser) return;

    // Unified Realtime Channel for instant WebSocket Broadcast + Postgres Changes fallback
    const channel = supabase.channel('rucked-live-chat');

    channel
      // 1. Broadcast event listeners (< 10ms instant peer-to-peer WebSocket messaging)
      .on('broadcast', { event: 'new-statement' }, ({ payload }) => {
        const newStmt = payload as Statement;
        if (activeTopicRef.current && newStmt.topic_id === activeTopicRef.current.id) {
          setStatements((prev) => {
            if (prev.some((s) => s.id === newStmt.id)) return prev;
            return [...prev, newStmt];
          });
        }
        setTopics((prev) =>
          prev
            .map((t) =>
              t.id === newStmt.topic_id
                ? {
                    ...t,
                    statementCount: (t.statementCount || 0) + 1,
                    lastStatementPreview: newStmt.content,
                    lastActivityAt: newStmt.created_at,
                  }
                : t
            )
            .sort((a, b) => {
              const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
              const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
              return timeB - timeA;
            })
        );
      })
      .on('broadcast', { event: 'edit-statement' }, ({ payload }) => {
        const { id, content, topic_id } = payload;
        if (activeTopicRef.current && topic_id === activeTopicRef.current.id) {
          setStatements((prev) =>
            prev.map((s) => (s.id === id ? { ...s, content } : s))
          );
        }
        setTopics((prev) =>
          prev.map((t) => (t.id === topic_id ? { ...t, lastStatementPreview: content } : t))
        );
      })
      .on('broadcast', { event: 'delete-statement' }, ({ payload }) => {
        const { id, topic_id } = payload;
        if (activeTopicRef.current && topic_id === activeTopicRef.current.id) {
          setStatements((prev) => prev.filter((s) => s.id !== id));
        }
      })
      .on('broadcast', { event: 'new-topic' }, () => {
        fetchTopics();
      })
      .on('broadcast', { event: 'call-state' }, ({ payload }) => {
        const { topicId, isActive } = payload as { topicId: string; isActive: boolean };
        setActiveCallTopicIds((prev) => {
          const next = new Set(prev);
          if (isActive) next.add(topicId);
          else next.delete(topicId);
          return next;
        });
      })
      // 2. Database WAL Change Listeners
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'statements' },
        (payload) => {
          const newStmt = payload.new as Statement;
          if (activeTopicRef.current && newStmt.topic_id === activeTopicRef.current.id) {
            setStatements((prev) => {
              if (prev.some((s) => s.id === newStmt.id)) return prev;
              return [...prev, newStmt];
            });
          }
          setTopics((prev) =>
            prev
              .map((t) =>
                t.id === newStmt.topic_id
                  ? {
                      ...t,
                      statementCount: (t.statementCount || 0) + 1,
                      lastStatementPreview: newStmt.content,
                      lastActivityAt: newStmt.created_at,
                    }
                  : t
              )
              .sort((a, b) => {
                const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
                const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
                return timeB - timeA;
              })
          );
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topics' },
        () => {
          fetchTopics();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          chatChannelRef.current = channel;
        }
      });

    return () => {
      supabase.removeChannel(channel);
      chatChannelRef.current = null;
    };
  }, [currentUser, fetchTopics]);

  // ─── Sign Out ───────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  // ─── Topic Handlers ─────────────────────────────────────────────────────────

  const handleSelectTopic = (topic: TopicWithPreview) => {
    setActiveTopic(topic);
    setShowMobileChat(true);
  };

  const handleCreateTopic = async (title: string, isGroup: boolean = false, memberUsernames: string[] = []) => {
    if (!currentUser) return;

    try {
      let createdTopic: Topic | null = null;

      // 1. Insert Topic with fallback if schema columns are missing
      const { data: newTopic, error } = await supabase
        .from('topics')
        .insert([{ title, is_group: isGroup, created_by: currentUser.id }])
        .select()
        .single();

      if (error) {
        console.warn('Primary topic insert failed, attempting fallback (title only):', error.message);
        // Fallback for older database schemas without is_group / created_by columns
        const { data: fallbackTopic, error: fallbackError } = await supabase
          .from('topics')
          .insert([{ title }])
          .select()
          .single();

        if (fallbackError) {
          console.error('Fallback topic insert also failed:', fallbackError);
          alert(`Failed to create topic: ${fallbackError.message || error.message}`);
          return;
        }
        createdTopic = fallbackTopic;
      } else {
        createdTopic = newTopic;
      }

      if (!createdTopic) {
        alert('Failed to create topic: Database returned no data.');
        return;
      }

      // 2. Add creator as Admin in topic_members (ignore error if table/column missing)
      const { error: memberErr } = await supabase.from('topic_members').insert([
        {
          topic_id: createdTopic.id,
          user_id: currentUser.id,
          role: 'admin',
        },
      ]);
      if (memberErr) {
        console.warn('Could not insert admin member record:', memberErr.message);
      }

      // 3. Add specified members by username
      if (memberUsernames && memberUsernames.length > 0) {
        for (const username of memberUsernames) {
          const { data: p } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', username)
            .single();

          if (p && p.id !== currentUser.id) {
            const { error: addErr } = await supabase.from('topic_members').insert([
              {
                topic_id: createdTopic.id,
                user_id: p.id,
                role: 'edit',
              },
            ]);
            if (addErr) console.warn(`Could not add member @${username}:`, addErr.message);
          }
        }
      }

      // Prepend to local state immediately so UI updates zero-delay
      const newTopicWithPreview: TopicWithPreview = {
        id: createdTopic.id,
        title: createdTopic.title,
        created_at: createdTopic.created_at,
        is_group: isGroup,
        created_by: currentUser.id,
        statementCount: 0,
        lastActivityAt: createdTopic.created_at,
        members: [
          {
            topic_id: createdTopic.id,
            user_id: currentUser.id,
            role: 'admin',
            created_at: new Date().toISOString(),
            profile: currentProfile,
          },
        ],
        myRole: 'admin',
        dm_peer: null,
      };

      setTopics((prev) => [newTopicWithPreview, ...prev.filter((t) => t.id !== createdTopic!.id)]);
      setActiveTopic(newTopicWithPreview);
      setShowMobileChat(true);

      // Re-fetch in background to sync full server state
      fetchTopics();
    } catch (err: any) {
      console.error('Error creating topic:', err);
      alert(`Error creating topic: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleSaveRename = async (newTitle: string) => {
    if (!activeTopic || activeTopic.myRole !== 'admin') return;
    setIsProcessingModal(true);

    const { error } = await supabase
      .from('topics')
      .update({ title: newTitle })
      .eq('id', activeTopic.id);

    if (!error) {
      setActiveTopic((prev) => (prev ? { ...prev, title: newTitle } : null));
      setTopics((prev) =>
        prev.map((t) => (t.id === activeTopic.id ? { ...t, title: newTitle } : t))
      );
    }

    setIsRenameModalOpen(false);
    setIsProcessingModal(false);
  };

  const handleConfirmDeleteTopic = async () => {
    if (!activeTopic || activeTopic.myRole !== 'admin') return;
    setIsProcessingModal(true);

    await supabase.from('topics').delete().eq('id', activeTopic.id);

    const remaining = topics.filter((t) => t.id !== activeTopic.id);
    setTopics(remaining);
    setActiveTopic(remaining.length > 0 ? remaining[0] : null);
    setIsDeleteModalOpen(false);
    setShowMobileChat(false);
    setIsProcessingModal(false);
  };

  // ─── Statement Handlers ─────────────────────────────────────────────────────

  const handleSendStatement = async (content: string) => {
    if (!activeTopic || activeTopic.myRole === 'view') return;

    const { data, error } = await supabase
      .from('statements')
      .insert([{ topic_id: activeTopic.id, content, sender_id: currentUser?.id ?? null }])
      .select()
      .single();

    if (error) { console.error('Error sending statement:', error); return; }

    setStatements((prev) => [...prev, data]);
    setTopics((prev) =>
      prev
        .map((t) =>
          t.id === activeTopic.id
            ? {
                ...t,
                statementCount: (t.statementCount || 0) + 1,
                lastStatementPreview: content,
                lastActivityAt: data.created_at,
              }
            : t
        )
        .sort((a, b) => {
          const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
          const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
          return timeB - timeA;
        })
    );

    chatChannelRef.current?.send({
      type: 'broadcast',
      event: 'new-statement',
      payload: data,
    });
  };

  const handleEditStatement = async (statementId: string, newContent: string) => {
    if (activeTopic?.myRole === 'view') return;

    const { error } = await supabase
      .from('statements')
      .update({ content: newContent })
      .eq('id', statementId);

    if (error) { console.error('Error editing statement:', error); return; }

    setStatements((prev) =>
      prev.map((s) => (s.id === statementId ? { ...s, content: newContent } : s))
    );
    if (statements[statements.length - 1]?.id === statementId && activeTopic) {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === activeTopic.id ? { ...t, lastStatementPreview: newContent } : t
        )
      );
    }

    chatChannelRef.current?.send({
      type: 'broadcast',
      event: 'edit-statement',
      payload: { id: statementId, content: newContent, topic_id: activeTopic?.id },
    });
  };

  const handleDeleteStatement = async (statementId: string) => {
    if (!activeTopic || activeTopic.myRole === 'view') return;

    await supabase.from('statements').delete().eq('id', statementId);

    const updatedStmts = statements.filter((s) => s.id !== statementId);
    setStatements(updatedStmts);
    const lastStmt = updatedStmts[updatedStmts.length - 1];
    setTopics((prev) =>
      prev.map((t) =>
        t.id === activeTopic.id
          ? {
              ...t,
              statementCount: Math.max(0, (t.statementCount || 1) - 1),
              lastStatementPreview: lastStmt?.content,
            }
          : t
      )
    );

    chatChannelRef.current?.send({
      type: 'broadcast',
      event: 'delete-statement',
      payload: { id: statementId, topic_id: activeTopic.id },
    });
  };

  // ─── Loading screen ─────────────────────────────────────────────────────────

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#111B21]">
        <Loader2 className="w-8 h-8 text-[#00A884] animate-spin" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const handleCallStateChange = (topicId: string, isActive: boolean) => {
    setActiveCallTopicIds((prev) => {
      const next = new Set(prev);
      if (isActive) next.add(topicId);
      else next.delete(topicId);
      return next;
    });

    chatChannelRef.current?.send({
      type: 'broadcast',
      event: 'call-state',
      payload: { topicId, isActive },
    });
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-full overflow-hidden bg-[#111B21]">
      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={`w-full md:w-[30%] lg:w-[28%] xl:w-[25%] h-full shrink-0 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          <TopicList
            topics={topics}
            activeTopicId={activeTopic?.id || null}
            onSelectTopic={handleSelectTopic}
            onCreateTopic={handleCreateTopic}
            isLoading={isLoadingTopics}
            currentProfile={currentProfile}
            onSignOut={handleSignOut}
            activeCallTopicIds={activeCallTopicIds}
          />
        </div>

        {/* Right Chat Area */}
        <div
          className={`w-full md:w-[70%] lg:w-[72%] xl:w-[75%] h-full flex flex-col bg-[#0B141A] ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeTopic ? (
            <>
              <ChatHeader
                topic={activeTopic}
                statementCount={statements.length}
                onBackMobile={() => setShowMobileChat(false)}
                onRenameTopic={() => setIsRenameModalOpen(true)}
                onDeleteTopic={() => setIsDeleteModalOpen(true)}
                currentProfile={currentProfile}
                onMemberAdded={fetchTopics}
                isCallActive={activeCallTopicIds.has(activeTopic.id)}
                onCallStateChange={(isActive) => handleCallStateChange(activeTopic.id, isActive)}
              />
              <MessageList
                statements={statements}
                isLoading={isLoadingStatements}
                onEditStatement={handleEditStatement}
                onDeleteStatement={handleDeleteStatement}
                currentUser={currentUser}
              />
              <MessageInput
                onSend={handleSendStatement}
                disabled={activeTopic.myRole === 'view'}
                disabledReason="You have view-only access to this topic."
              />
            </>
          ) : (
            <EmptyState type="no-selection" />
          )}
        </div>
      </div>

      {/* Rename Modal */}
      {activeTopic && (
        <RenameModal
          isOpen={isRenameModalOpen}
          initialTitle={activeTopic.title}
          onSave={handleSaveRename}
          onCancel={() => setIsRenameModalOpen(false)}
          isLoading={isProcessingModal}
        />
      )}

      {/* Delete Confirm Modal */}
      {activeTopic && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title={`Delete "${activeTopic.title}"?`}
          message="Are you sure you want to delete this topic? All statements inside it will be permanently deleted."
          confirmText="Delete Topic"
          confirmVariant="danger"
          onConfirm={handleConfirmDeleteTopic}
          onCancel={() => setIsDeleteModalOpen(false)}
          isLoading={isProcessingModal}
        />
      )}
    </div>
  );
}
