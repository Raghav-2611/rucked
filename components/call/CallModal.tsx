'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useTracks,
  useChat,
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
  Monitor,
  MonitorOff,
  MessageSquare,
  Send,
  X,
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

// ─── In-Call Ephemeral Chat Drawer ───────────────────────────────────────────

function InCallChatPanel({ onClose }: { onClose: () => void }) {
  const { chatMessages, send, isSending } = useChat();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    const msg = text.trim();
    setText('');
    await send(msg);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="w-full sm:w-80 md:w-96 h-full bg-[#202C33] border-l border-[#2A3942] flex flex-col shrink-0 z-50 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 bg-[#111B21] border-b border-[#2A3942] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#00A884]" />
          <h3 className="text-sm font-bold text-[#E9EDEF]">In-Call Chat</h3>
          <span className="text-[10px] bg-[#00A884]/20 text-[#00A884] px-1.5 py-0.5 rounded font-semibold">
            Temporary
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#8696A0] hover:text-[#E9EDEF] rounded-lg hover:bg-[#202C33] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0B141A]">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8696A0]">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-semibold text-[#E9EDEF]">In-Call Messages</p>
            <p className="text-[11px] opacity-75 mt-1 max-w-[200px]">
              Messages sent here only stay active while the call is running and are not saved.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.from?.isLocal;
            const senderName = msg.from?.name || msg.from?.identity || 'Someone';

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <span className="text-[10px] text-[#8696A0] px-1 mb-0.5 font-medium">
                  {isMe ? 'You' : senderName}
                </span>
                <div
                  className={`px-3 py-2 rounded-xl text-xs break-words ${
                    isMe
                      ? 'bg-[#005C4B] text-[#E9EDEF] rounded-tr-none'
                      : 'bg-[#202C33] text-[#E9EDEF] rounded-tl-none border border-[#2A3942]'
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[9px] text-[#8696A0] px-1 mt-0.5">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-[#111B21] border-t border-[#2A3942] flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send message in call..."
          className="flex-1 bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="p-2 rounded-xl bg-[#00A884] hover:bg-[#008f70] text-white disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
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
  const [showChat, setShowChat] = useState(false);
  const { chatMessages } = useChat();

  const toggleMic = useCallback(async () => {
    const newState = !isMuted;
    await localParticipant.setMicrophoneEnabled(!newState);
    setIsMuted(newState);
  }, [localParticipant, isMuted]);

  return (
    <div className="flex h-full w-full bg-[#111B21] overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Participants grid */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="flex flex-wrap gap-10 justify-center max-w-2xl">
            {participants.map((p) => (
              <VoiceParticipant key={p.identity} participant={p} />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="shrink-0 pb-8 pt-4 flex items-center justify-center gap-4 border-t border-[#2A3942]/40 bg-[#111B21]">
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

          {/* In-Call Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
              showChat
                ? 'bg-[#00A884] text-white border border-[#00A884]'
                : 'bg-[#202C33] text-[#E9EDEF] border border-[#2A3942] hover:bg-[#2A3942]'
            }`}
            title="In-Call Chat"
          >
            <MessageSquare className="w-6 h-6" />
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#00A884] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#111B21]">
                {chatMessages.length}
              </span>
            )}
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

      {/* Side Chat Drawer */}
      {showChat && <InCallChatPanel onClose={() => setShowChat(false)} />}
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { chatMessages } = useChat();

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

  const toggleScreenShare = useCallback(async () => {
    try {
      const newState = !isScreenSharing;
      await localParticipant.setScreenShareEnabled(newState);
      setIsScreenSharing(newState);
    } catch (err) {
      console.error('Screen share error:', err);
    }
  }, [localParticipant, isScreenSharing]);

  const isSolo = tracks.length <= 1;

  return (
    <div className="flex h-full w-full bg-[#0B141A] overflow-hidden relative">
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Video Grid Area */}
        <div className="flex-1 w-full h-full min-h-0 overflow-hidden flex items-center justify-center p-2 sm:p-4">
          <div className={`w-full h-full max-h-full flex items-center justify-center ${isSolo ? 'max-w-[700px] max-h-[70vh]' : ''}`}>
            <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
              <ParticipantTile />
            </GridLayout>
          </div>
        </div>

        {/* Control Bar - Always Pinned & Visible at Bottom */}
        <div className="shrink-0 py-3.5 px-4 sm:px-6 bg-[#202C33]/95 backdrop-blur-md border-t border-[#2A3942] flex items-center justify-center gap-3 sm:gap-6 z-50">
          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer ${
              isMicMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] hover:bg-[#2A3942]'
            }`}
            title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
            <span className="text-[10px] font-medium hidden sm:inline">{isMicMuted ? 'Muted' : 'Mic'}</span>
          </button>

          {/* Cam Toggle */}
          <button
            onClick={toggleCam}
            className={`flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer ${
              isCamOff
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] hover:bg-[#2A3942]'
            }`}
            title={isCamOff ? 'Turn On Camera' : 'Turn Off Camera'}
          >
            {isCamOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
            <span className="text-[10px] font-medium hidden sm:inline">{isCamOff ? 'Cam Off' : 'Camera'}</span>
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40 hover:bg-[#00A884]/30'
                : 'bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] hover:bg-[#2A3942]'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A884]" /> : <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />}
            <span className="text-[10px] font-medium hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Screen Share'}</span>
          </button>

          {/* In-Call Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`relative flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer ${
              showChat
                ? 'bg-[#00A884] text-white border border-[#00A884]'
                : 'bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] hover:bg-[#2A3942]'
            }`}
            title="In-Call Chat"
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00A884] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#111B21]">
                {chatMessages.length}
              </span>
            )}
            <span className="text-[10px] font-medium hidden sm:inline">Chat</span>
          </button>

          {/* End Call Button */}
          <button
            onClick={onEnd}
            className="flex flex-col items-center justify-center p-2.5 sm:px-6 sm:py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all shadow-lg shadow-red-500/30 cursor-pointer"
            title="End Call"
          >
            <div className="flex items-center gap-2">
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs font-bold hidden sm:inline">End Call</span>
            </div>
          </button>
        </div>
      </div>

      {/* Side Chat Drawer */}
      {showChat && <InCallChatPanel onClose={() => setShowChat(false)} />}
    </div>
  );
}

// ─── Main CallModal ───────────────────────────────────────────────────────────

export function CallModal({ isOpen, topicTitle, token, mode, onDisconnect }: CallModalProps) {
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://rucked-zhvhpdmu.livekit.cloud';
  const [participantCount, setParticipantCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-[#111B21] overflow-hidden w-screen h-screen">
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
    </div>,
    document.body
  );
}
