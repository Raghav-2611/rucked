'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useTracks,
  GridLayout,
  ParticipantTile,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
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
    const newState = !isMuted;
    await localParticipant.setMicrophoneEnabled(!newState);
    setIsMuted(newState);
  }, [localParticipant, isMuted]);

  return (
    <div className="flex flex-col h-full bg-[#111B21]">
      {/* Participants grid */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="flex flex-wrap gap-10 justify-center max-w-2xl">
          {participants.map((p) => (
            <VoiceParticipant key={p.identity} participant={p} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 pb-10 pt-4 flex items-center justify-center gap-4 border-t border-[#2A3942]/40 bg-[#111B21]">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
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
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30 cursor-pointer"
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
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const { localParticipant } = useLocalParticipant();
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const toggleMic = useCallback(async () => {
    const newState = !isMicMuted;
    await localParticipant.setMicrophoneEnabled(!newState);
    setIsMicMuted(newState);
  }, [localParticipant, isMicMuted]);

  const toggleCam = useCallback(async () => {
    const newState = !isCamOff;
    await localParticipant.setCameraEnabled(!newState);
    setIsCamOff(newState);
  }, [localParticipant, isCamOff]);

  const isSolo = tracks.length <= 1;

  return (
    <div className="flex flex-col h-full w-full bg-[#0B141A] overflow-hidden">
      {/* Video Grid Area */}
      <div className="flex-1 w-full h-full min-h-0 overflow-hidden flex items-center justify-center p-2 sm:p-4">
        <div className={`w-full h-full max-h-full flex items-center justify-center ${isSolo ? 'max-w-md max-h-[70vh]' : ''}`}>
          <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
            <ParticipantTile />
          </GridLayout>
        </div>
      </div>

      {/* Control Bar - Always Pinned at Bottom */}
      <div className="shrink-0 py-4 px-6 bg-[#202C33] border-t border-[#2A3942] flex items-center justify-center gap-4 z-50">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
            isMicMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
              : 'bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] hover:bg-[#2A3942]'
          }`}
          title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMicMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        <button
          onClick={toggleCam}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
            isCamOff
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
              : 'bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] hover:bg-[#2A3942]'
          }`}
          title={isCamOff ? 'Turn On Camera' : 'Turn Off Camera'}
        >
          {isCamOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        <button
          onClick={onEnd}
          className="w-14 h-12 sm:w-16 sm:h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30 cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#111B21] overflow-hidden">
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
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <LiveKitRoom
          token={token}
          serverUrl={wsUrl}
          connect={true}
          audio={true}
          video={mode === 'video'}
          onDisconnected={onDisconnect}
          style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
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
