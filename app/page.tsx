'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Topic, Statement, TopicWithPreview } from '@/lib/types';
import { TopicList } from '@/components/sidebar/TopicList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RenameModal } from '@/components/ui/RenameModal';
import { ConfigBanner } from '@/components/ui/ConfigBanner';

// Mock initial data for local demo mode when env vars aren't set
const INITIAL_DEMO_TOPICS: Topic[] = [
  {
    id: 'demo-1',
    title: 'Docker & Containers',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Project Ideas',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const INITIAL_DEMO_STATEMENTS: Statement[] = [
  {
    id: 'stmt-1',
    topic_id: 'demo-1',
    content: 'Today I learned about Docker volumes and named mounts.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'stmt-2',
    topic_id: 'demo-1',
    content: 'Use `docker compose up -d` to run services in detached background mode.',
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'stmt-3',
    topic_id: 'demo-2',
    content: 'Build a personal thought log called "rucked" with WhatsApp dark theme UI.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default function HomePage() {
  const [hasSupabase, setHasSupabase] = useState<boolean>(true);
  const [topics, setTopics] = useState<TopicWithPreview[]>([]);
  const [activeTopic, setActiveTopic] = useState<TopicWithPreview | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  
  // UI states
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(true);
  const [isLoadingStatements, setIsLoadingStatements] = useState<boolean>(false);
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);

  // Modals state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessingModal, setIsProcessingModal] = useState(false);

  // Fallback demo storage
  const [demoTopics, setDemoTopics] = useState<Topic[]>(INITIAL_DEMO_TOPICS);
  const [demoStatements, setDemoStatements] = useState<Statement[]>(INITIAL_DEMO_STATEMENTS);

  useEffect(() => {
    setHasSupabase(isSupabaseConfigured());
  }, []);

  // Fetch Topics and calculate previews & counts
  const fetchTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    try {
      if (isSupabaseConfigured()) {
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('*')
          .order('created_at', { ascending: false });

        if (topicsError) throw topicsError;

        if (topicsData) {
          // Fetch latest statements for each topic preview
          const { data: stmtsData } = await supabase
            .from('statements')
            .select('*')
            .order('created_at', { ascending: true });

          const enhancedTopics: TopicWithPreview[] = topicsData.map((t: Topic) => {
            const topicStmts = (stmtsData || []).filter((s: Statement) => s.topic_id === t.id);
            const lastStmt = topicStmts[topicStmts.length - 1];

            return {
              ...t,
              statementCount: topicStmts.length,
              lastStatementPreview: lastStmt ? lastStmt.content : undefined,
              lastActivityAt: lastStmt ? lastStmt.created_at : t.created_at,
            };
          });

          // Sort by latest activity
          enhancedTopics.sort((a, b) => {
            const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
            const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
            return timeB - timeA;
          });

          setTopics(enhancedTopics);
          if (!activeTopic && enhancedTopics.length > 0) {
            setActiveTopic(enhancedTopics[0]);
          }
        }
      } else {
        // Fallback demo mode
        const enhancedTopics: TopicWithPreview[] = demoTopics.map((t) => {
          const topicStmts = demoStatements.filter((s) => s.topic_id === t.id);
          const lastStmt = topicStmts[topicStmts.length - 1];
          return {
            ...t,
            statementCount: topicStmts.length,
            lastStatementPreview: lastStmt ? lastStmt.content : undefined,
            lastActivityAt: lastStmt ? lastStmt.created_at : t.created_at,
          };
        });

        enhancedTopics.sort((a, b) => {
          const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
          const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
          return timeB - timeA;
        });

        setTopics(enhancedTopics);
        if (!activeTopic && enhancedTopics.length > 0) {
          setActiveTopic(enhancedTopics[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching topics:', err?.message || JSON.stringify(err));
    } finally {
      setIsLoadingTopics(false);
    }
  }, [activeTopic, demoTopics, demoStatements]);

  useEffect(() => {
    fetchTopics();
  }, [demoTopics, demoStatements]);

  // Fetch Statements for Active Topic
  const fetchStatements = useCallback(async (topicId: string) => {
    setIsLoadingStatements(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('statements')
          .select('*')
          .eq('topic_id', topicId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setStatements(data || []);
      } else {
        const stmts = demoStatements.filter((s) => s.topic_id === topicId);
        stmts.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setStatements(stmts);
      }
    } catch (err: any) {
      console.error('Error fetching statements:', err?.message || JSON.stringify(err));
    } finally {
      setIsLoadingStatements(false);
    }
  }, [demoStatements]);

  useEffect(() => {
    if (activeTopic) {
      fetchStatements(activeTopic.id);
    } else {
      setStatements([]);
    }
  }, [activeTopic, fetchStatements]);

  // Handle Select Topic
  const handleSelectTopic = (topic: TopicWithPreview) => {
    setActiveTopic(topic);
    setShowMobileChat(true);
  };

  // Create Topic
  const handleCreateTopic = async (title: string) => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('topics')
          .insert([{ title }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const newTopic: TopicWithPreview = {
            ...data,
            statementCount: 0,
            lastActivityAt: data.created_at,
          };
          setTopics((prev) => [newTopic, ...prev]);
          setActiveTopic(newTopic);
          setShowMobileChat(true);
        }
      } else {
        const newTopic: Topic = {
          id: `demo-${Date.now()}`,
          title,
          created_at: new Date().toISOString(),
        };
        setDemoTopics((prev) => [newTopic, ...prev]);
        const enhanced: TopicWithPreview = {
          ...newTopic,
          statementCount: 0,
          lastActivityAt: newTopic.created_at,
        };
        setActiveTopic(enhanced);
        setShowMobileChat(true);
      }
    } catch (err: any) {
      console.error('Error creating topic:', err?.message || JSON.stringify(err));
    }
  };

  // Rename Topic
  const handleSaveRename = async (newTitle: string) => {
    if (!activeTopic) return;
    try {
      setIsProcessingModal(true);
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('topics')
          .update({ title: newTitle })
          .eq('id', activeTopic.id);

        if (error) throw error;
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
    } catch (err: any) {
      console.error('Error renaming topic:', err?.message || JSON.stringify(err));
    } finally {
      setIsProcessingModal(false);
    }
  };

  // Delete Topic
  const handleConfirmDeleteTopic = async () => {
    if (!activeTopic) return;
    try {
      setIsProcessingModal(true);
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('topics')
          .delete()
          .eq('id', activeTopic.id);

        if (error) throw error;
      } else {
        setDemoTopics((prev) => prev.filter((t) => t.id !== activeTopic.id));
        setDemoStatements((prev) => prev.filter((s) => s.topic_id !== activeTopic.id));
      }

      const remaining = topics.filter((t) => t.id !== activeTopic.id);
      setTopics(remaining);
      setActiveTopic(remaining.length > 0 ? remaining[0] : null);
      setIsDeleteModalOpen(false);
      setShowMobileChat(false);
    } catch (err: any) {
      console.error('Error deleting topic:', err?.message || JSON.stringify(err));
    } finally {
      setIsProcessingModal(false);
    }
  };

  // Send Statement
  const handleSendStatement = async (content: string) => {
    if (!activeTopic) return;
    const nowStr = new Date().toISOString();

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('statements')
          .insert([{ topic_id: activeTopic.id, content }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setStatements((prev) => [...prev, data]);
          
          // Update topic preview and order
          setTopics((prev) => {
            const updated = prev.map((t) => {
              if (t.id === activeTopic.id) {
                return {
                  ...t,
                  statementCount: (t.statementCount || 0) + 1,
                  lastStatementPreview: content,
                  lastActivityAt: nowStr,
                };
              }
              return t;
            });
            return updated.sort((a, b) => {
              const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
              const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
              return timeB - timeA;
            });
          });
        }
      } else {
        const newStmt: Statement = {
          id: `stmt-${Date.now()}`,
          topic_id: activeTopic.id,
          content,
          created_at: nowStr,
        };
        setDemoStatements((prev) => [...prev, newStmt]);
        setStatements((prev) => [...prev, newStmt]);

        setTopics((prev) => {
          const updated = prev.map((t) => {
            if (t.id === activeTopic.id) {
              return {
                ...t,
                statementCount: (t.statementCount || 0) + 1,
                lastStatementPreview: content,
                lastActivityAt: nowStr,
              };
            }
            return t;
          });
          return updated.sort((a, b) => {
            const timeA = new Date(a.lastActivityAt || a.created_at).getTime();
            const timeB = new Date(b.lastActivityAt || b.created_at).getTime();
            return timeB - timeA;
          });
        });
      }
    } catch (err: any) {
      console.error('Error sending statement:', err?.message || JSON.stringify(err));
    }
  };

  // Edit Statement
  const handleEditStatement = async (statementId: string, newContent: string) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('statements')
          .update({ content: newContent })
          .eq('id', statementId);

        if (error) throw error;
      } else {
        setDemoStatements((prev) =>
          prev.map((s) => (s.id === statementId ? { ...s, content: newContent } : s))
        );
      }

      setStatements((prev) =>
        prev.map((s) => (s.id === statementId ? { ...s, content: newContent } : s))
      );

      // Update topic preview if edited statement was the last one
      if (statements[statements.length - 1]?.id === statementId && activeTopic) {
        setTopics((prev) =>
          prev.map((t) =>
            t.id === activeTopic.id ? { ...t, lastStatementPreview: newContent } : t
          )
        );
      }
    } catch (err: any) {
      console.error('Error editing statement:', err?.message || JSON.stringify(err));
    }
  };

  // Delete Statement
  const handleDeleteStatement = async (statementId: string) => {
    if (!activeTopic) return;
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('statements')
          .delete()
          .eq('id', statementId);

        if (error) throw error;
      } else {
        setDemoStatements((prev) => prev.filter((s) => s.id !== statementId));
      }

      const updatedStmts = statements.filter((s) => s.id !== statementId);
      setStatements(updatedStmts);

      const lastStmt = updatedStmts[updatedStmts.length - 1];
      setTopics((prev) =>
        prev.map((t) => {
          if (t.id === activeTopic.id) {
            return {
              ...t,
              statementCount: Math.max(0, (t.statementCount || 1) - 1),
              lastStatementPreview: lastStmt ? lastStmt.content : undefined,
            };
          }
          return t;
        })
      );
    } catch (err: any) {
      console.error('Error deleting statement:', err?.message || JSON.stringify(err));
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#111B21]">
      {!hasSupabase && <ConfigBanner />}

      {/* Main Dual-Pane Workspace */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* Left Sidebar (30% Desktop / Full Mobile when active) */}
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
          />
        </div>

        {/* Right Chat Area (70% Desktop / Full Mobile when active) */}
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

      {/* Delete Topic Confirm Modal */}
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
