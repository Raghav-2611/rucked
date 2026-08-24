"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Topic, Statement, TopicWithPreview, Profile } from '@/lib/types';
import { TopicList } from '@/components/sidebar/TopicList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RenameModal } from '@/components/ui/RenameModal';

// ─── Demo fallback data (used only when Supabase is not configured) ───────────

const MOCK_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000000',
  username: 'guest',
  display_name: 'Guest User',
  avatar_url: null,
  created_at: new Date().toISOString(),
};

const INITIAL_DEMO_TOPICS: Topic[] = [
  {
    id: 'demo-1',
    title: 'Docker & Containers',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_group: false,
    created_by: null,
  },
  {
    id: 'demo-2',
    title: 'Project Ideas',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    is_group: true,
    created_by: null,
  },
];

const INITIAL_DEMO_STATEMENTS: Statement[] = [
  {
    id: 'stmt-1',
    topic_id: 'demo-1',
    content: 'Today I learned about Docker volumes and named mounts.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    sender_id: 'demo-user-1',
  },
  {
    id: 'stmt-2',
    topic_id: 'demo-1',
    content: 'Use `docker compose up -d` to run services in detached background mode.',
    created_at: new Date(Date.now() - 43200000).toISOString(),
    sender_id: 'demo-user-1',
  },
  {
    id: 'stmt-3',
    topic_id: 'demo-2',
    content: 'Build a personal thought log called "rucked" with WhatsApp dark theme UI.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    sender_id: 'demo-user-2',
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const hasSupabase = isSupabaseConfigured();
  const [currentProfile] = useState<Profile>(MOCK_PROFILE);

  const [topics, setTopics] = useState<TopicWithPreview[]>([]);
  const [activeTopic, setActiveTopic] = useState<TopicWithPreview | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);

  // UI state
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(true);
  const [isLoadingStatements, setIsLoadingStatements] = useState<boolean>(false);
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);

  // Modals
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessingModal, setIsProcessingModal] = useState(false);

  // Demo-only local state (used when Supabase is not configured)
  const [demoTopics, setDemoTopics] = useState<Topic[]>(INITIAL_DEMO_TOPICS);
  const [demoStatements, setDemoStatements] = useState<Statement[]>(INITIAL_DEMO_STATEMENTS);

  // ─── Fetch Topics ───────────────────────────────────────────────────────────

  const fetchTopics = useCallback(async () => {
    setIsLoadingTopics(true);

    if (hasSupabase) {
      // 1. Fetch all topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (topicsError) {
        console.error('Error fetching topics:', topicsError);
        setIsLoadingTopics(false);
        return;
      }

      // 2. For each topic, fetch the most recent statement for preview + count
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

          const lastStmt = stmts?.[0];
          return {
            ...t,
            statementCount: count ?? 0,
            lastStatementPreview: lastStmt?.content,
            lastActivityAt: lastStmt?.created_at ?? t.created_at,
            members: [],
            dm_peer: null,
          };
        })
      );

      // Sort by last activity
      enhanced.sort((a, b) => {
        const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
        const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
        return timeB - timeA;
      });

      setTopics(enhanced);
      if (!activeTopic && enhanced.length > 0) setActiveTopic(enhanced[0]);
    } else {
      // Demo fallback
      const enhancedTopics: TopicWithPreview[] = demoTopics.map((t) => {
        const topicStmts = demoStatements.filter((s) => s.topic_id === t.id);
        const lastStmt = topicStmts[topicStmts.length - 1];
        return {
          ...t,
          statementCount: topicStmts.length,
          lastStatementPreview: lastStmt?.content,
          lastActivityAt: lastStmt?.created_at ?? t.created_at,
          members: [],
          dm_peer: null,
        };
      });
      enhancedTopics.sort((a, b) => {
        const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
        const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
        return timeB - timeA;
      });
      setTopics(enhancedTopics);
      if (!activeTopic && enhancedTopics.length > 0) setActiveTopic(enhancedTopics[0]);
    }

    setIsLoadingTopics(false);
  }, [hasSupabase, demoTopics, demoStatements, activeTopic]);

  useEffect(() => {
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSupabase]);

  // ─── Fetch Statements ───────────────────────────────────────────────────────

  const fetchStatements = useCallback(
    async (topicId: string) => {
      setIsLoadingStatements(true);

      if (hasSupabase) {
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
      } else {
        const stmts = demoStatements.filter((s) => s.topic_id === topicId);
        stmts.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setStatements(stmts);
      }

      setIsLoadingStatements(false);
    },
    [hasSupabase, demoStatements]
  );

  useEffect(() => {
    if (activeTopic) fetchStatements(activeTopic.id);
    else setStatements([]);
  }, [activeTopic, fetchStatements]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectTopic = (topic: TopicWithPreview) => {
    setActiveTopic(topic);
    setShowMobileChat(true);
  };

  const handleCreateTopic = async (
    title: string,
    isGroup: boolean = false,
    _memberUsernames: string[] = []
  ) => {
    if (hasSupabase) {
      const { data, error } = await supabase
        .from('topics')
        .insert([{ title, is_group: isGroup }])
        .select()
        .single();

      if (error) {
        console.error('Error creating topic:', error);
        return;
      }

      const newEnhanced: TopicWithPreview = {
        ...data,
        statementCount: 0,
        lastActivityAt: data.created_at,
        members: [],
        dm_peer: null,
      };
      setTopics((prev) => [newEnhanced, ...prev]);
      setActiveTopic(newEnhanced);
    } else {
      const newTopic: Topic = {
        id: `demo-${Date.now()}`,
        title,
        created_at: new Date().toISOString(),
        is_group: isGroup,
        created_by: null,
      };
      setDemoTopics((prev) => [newTopic, ...prev]);
      const enhanced: TopicWithPreview = {
        ...newTopic,
        statementCount: 0,
        lastActivityAt: newTopic.created_at,
        members: [],
        dm_peer: null,
      };
      setTopics((prev) => [enhanced, ...prev]);
      setActiveTopic(enhanced);
    }
    setShowMobileChat(true);
  };

  const handleSaveRename = async (newTitle: string) => {
    if (!activeTopic) return;
    setIsProcessingModal(true);

    if (hasSupabase) {
      const { error } = await supabase
        .from('topics')
        .update({ title: newTitle })
        .eq('id', activeTopic.id);

      if (error) {
        console.error('Error renaming topic:', error);
        setIsProcessingModal(false);
        return;
      }
    } else {
      setDemoTopics((prev) =>
        prev.map((t) => (t.id === activeTopic.id ? { ...t, title: newTitle } : t))
      );
    }

    setActiveTopic((prev) => (prev ? { ...prev, title: newTitle } : null));
    setTopics((prev) =>
      prev.map((t) => (t.id === activeTopic.id ? { ...t, title: newTitle } : t))
    );
    setIsRenameModalOpen(false);
    setIsProcessingModal(false);
  };

  const handleConfirmDeleteTopic = async () => {
    if (!activeTopic) return;
    setIsProcessingModal(true);

    if (hasSupabase) {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', activeTopic.id);

      if (error) {
        console.error('Error deleting topic:', error);
        setIsProcessingModal(false);
        return;
      }
    } else {
      setDemoTopics((prev) => prev.filter((t) => t.id !== activeTopic.id));
      setDemoStatements((prev) => prev.filter((s) => s.topic_id !== activeTopic.id));
    }

    const remaining = topics.filter((t) => t.id !== activeTopic.id);
    setTopics(remaining);
    setActiveTopic(remaining.length > 0 ? remaining[0] : null);
    setIsDeleteModalOpen(false);
    setShowMobileChat(false);
    setIsProcessingModal(false);
  };

  const handleSendStatement = async (content: string) => {
    if (!activeTopic) return;
    const nowStr = new Date().toISOString();

    if (hasSupabase) {
      const { data, error } = await supabase
        .from('statements')
        .insert([{ topic_id: activeTopic.id, content }])
        .select()
        .single();

      if (error) {
        console.error('Error sending statement:', error);
        return;
      }

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
    } else {
      const newStmt: Statement = {
        id: `stmt-${Date.now()}`,
        topic_id: activeTopic.id,
        content,
        created_at: nowStr,
        sender_id: 'demo-user-1',
      };
      setDemoStatements((prev) => [...prev, newStmt]);
      setStatements((prev) => [...prev, newStmt]);
      setTopics((prev) =>
        prev
          .map((t) =>
            t.id === activeTopic.id
              ? {
                  ...t,
                  statementCount: (t.statementCount || 0) + 1,
                  lastStatementPreview: content,
                  lastActivityAt: nowStr,
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
  };

  const handleEditStatement = async (statementId: string, newContent: string) => {
    if (hasSupabase) {
      const { error } = await supabase
        .from('statements')
        .update({ content: newContent })
        .eq('id', statementId);

      if (error) {
        console.error('Error editing statement:', error);
        return;
      }
    } else {
      setDemoStatements((prev) =>
        prev.map((s) => (s.id === statementId ? { ...s, content: newContent } : s))
      );
    }

    setStatements((prev) =>
      prev.map((s) => (s.id === statementId ? { ...s, content: newContent } : s))
    );

    // Update sidebar preview if it was the last statement
    if (statements[statements.length - 1]?.id === statementId && activeTopic) {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === activeTopic.id ? { ...t, lastStatementPreview: newContent } : t
        )
      );
    }
  };

  const handleDeleteStatement = async (statementId: string) => {
    if (!activeTopic) return;

    if (hasSupabase) {
      const { error } = await supabase
        .from('statements')
        .delete()
        .eq('id', statementId);

      if (error) {
        console.error('Error deleting statement:', error);
        return;
      }
    } else {
      setDemoStatements((prev) => prev.filter((s) => s.id !== statementId));
    }

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
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#111B21]">
      {/* Main Dual-Pane Workspace */}
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
                onMemberAdded={fetchTopics}
              />

              <MessageList
                statements={statements}
                isLoading={isLoadingStatements}
                onEditStatement={handleEditStatement}
                onDeleteStatement={handleDeleteStatement}
              />

              <MessageInput onSend={handleSendStatement} />
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
