'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Phone, Video, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CallModal } from './CallModal';

interface CallButtonProps {
  topicId: string;
  topicTitle: string;
  participantName: string;
  displayName?: string;
  disabled?: boolean;
}

export function CallButton({
  topicId,
  topicTitle,
  participantName,
  displayName,
  disabled = false,
}: CallButtonProps) {
  const [callMode, setCallMode] = useState<'voice' | 'video' | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<'voice' | 'video' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Broadcast call state to all connected clients via Supabase Realtime
  const broadcastCallState = (isActive: boolean) => {
    const channel = supabase.channel('active-calls');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'call-state',
          payload: { topicId, isActive },
        });
      }
    });
    channelRef.current = channel;
  };

  // Cleanup channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const startCall = async (mode: 'voice' | 'video') => {
    if (isLoading || disabled) return;
    setError(null);
    setIsLoading(mode);

    try {
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, participantName, displayName }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to join call');
      }

      const { token: roomToken } = await res.json();
      setToken(roomToken);
      setCallMode(mode);

      // Broadcast that a call is now active in this topic
      broadcastCallState(true);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(null);
    }
  };

  const handleDisconnect = () => {
    // Broadcast that the call ended
    broadcastCallState(false);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setToken(null);
    setCallMode(null);
  };

  return (
    <>
      {/* Error toast */}
      {error && (
        <div className="absolute top-16 right-4 bg-red-500/90 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      {/* Voice Call Button */}
      <button
        onClick={() => startCall('voice')}
        disabled={disabled || !!isLoading}
        className="p-2 text-[#8696A0] hover:text-[#00A884] hover:bg-[#111B21] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        title={disabled ? 'Viewers cannot start calls' : 'Voice Call'}
      >
        {isLoading === 'voice' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Phone className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Voice</span>
      </button>

      {/* Video Call Button */}
      <button
        onClick={() => startCall('video')}
        disabled={disabled || !!isLoading}
        className="p-2 text-[#8696A0] hover:text-blue-400 hover:bg-[#111B21] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        title={disabled ? 'Viewers cannot start calls' : 'Video Call'}
      >
        {isLoading === 'video' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Video className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Video</span>
      </button>

      {/* Call Modal */}
      {callMode && token && (
        <CallModal
          isOpen={true}
          topicTitle={topicTitle}
          token={token}
          mode={callMode}
          onDisconnect={handleDisconnect}
        />
      )}
    </>
  );
}
