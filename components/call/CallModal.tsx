'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Volume2,
} from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  topicTitle: string;
  token: string;
  mode: 'voice' | 'video';
  onDisconnect: () => void;
}

// ─── Participant count tracker (must be inside LiveKitRoom) ───────────────────

function ParticipantCounter({ onCount }: { onCount: (n: number) => void }) {
  const participants = useParticipants();
  useEffect(() => {
    onCount(participants.length);
  }, [participants.length, onCount]);
  return null;
}

// ─── Voice Call UI ────────────────────────────────────────────────────────────

function VoiceParticipant({ participant }: { participant: any }) {
  const name = participant.name || participant.identity || 'Unknown';
  const initial = name[0]?.toUpperCase() || '?';
  const isSpeaking = participant.isSpeaking;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
          isSpeaking
            ? 'bg-[#00A884] text-white ring-4 ring-[#00A884]/50 ring-offset-4 ring-offset-[#111B21]'
            : 'bg-[#202C33] text-[#8696A0]'
        }`}
      >
        {initial}
        {isSpeaking && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00A884] rounded-full flex items-center justify-center">
            <Volume2 className="w-3 h-3 text-white" />
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-[#E9EDEF] max-w-[100px] truncate">{name}</span>
    </div>
  );
}

function VoiceCallUI({ onEnd }: { onEnd: () => void }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMic = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(isMuted);
    setIsMuted(!isMuted);
  }, [localParticipant, isMuted]);

  return (
    <div className="flex flex-col h-full bg-[#111B21]">
      {/* Participants grid */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-wrap gap-10 justify-center max-w-2xl">
          {participants.map((p) => (
            <VoiceParticipant key={p.identity} participant={p} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="pb-10 flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
              : 'bg-[#202C33] text-[#E9EDEF] border border-[#2A3942] hover:bg-[#2A3942]'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={onEnd}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}

// ─── Video Call UI ────────────────────────────────────────────────────────────

function VideoCallUI({ onEnd }: { onEnd: () => void }) {
  return (
    <div className="relative h-full bg-[#111B21]">
      <VideoConference />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={onEnd}
          className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all"
        >
          <PhoneOff className="w-4 h-4" /> End Call
        </button>
      </div>
    </div>
  );
}

// ─── Main CallModal ───────────────────────────────────────────────────────────

export function CallModal({ isOpen, topicTitle, token, mode, onDisconnect }: CallModalProps) {
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://rucked-zhvhpdmu.livekit.cloud';
  const [participantCount, setParticipantCount] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#111B21]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#202C33] border-b border-[#2A3942] shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${mode === 'video' ? 'bg-blue-400' : 'bg-[#00A884]'}`} />
          <div>
            <p className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">
              {mode === 'video' ? 'Video Call' : 'Voice Call'}
            </p>
            <h2 className="text-base font-bold text-[#E9EDEF] leading-tight">{topicTitle}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8696A0]">
          <Users className="w-3.5 h-3.5" />
          <span>{participantCount} connected</span>
        </div>
      </div>

      {/* LiveKit Room */}
      <div className="flex-1 overflow-hidden">
        <LiveKitRoom
          token={token}
          serverUrl={wsUrl}
          connect={true}
          audio={true}
          video={mode === 'video'}
          onDisconnected={onDisconnect}
          style={{ height: '100%' }}
        >
          <RoomAudioRenderer />
          <ParticipantCounter onCount={setParticipantCount} />
          {mode === 'voice' ? (
            <VoiceCallUI onEnd={onDisconnect} />
          ) : (
            <VideoCallUI onEnd={onDisconnect} />
          )}
        </LiveKitRoom>
      </div>
    </div>
  );
}
