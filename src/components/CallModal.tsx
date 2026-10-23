import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
} from 'lucide-react';

interface CallModalProps {
  currentUser: User | null;
  callee: User | null;
  callType: 'audio' | 'video';
  isIncoming?: boolean;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  currentUser,
  callee,
  callType,
  isIncoming = false,
  onEndCall,
}) => {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>(
    isIncoming ? 'ringing' : 'ringing'
  );
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize media devices safely
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startLocalMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === 'video',
          });
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Hardware media device unavailable, using simulated video/audio:', err);
      }
    };

    startLocalMedia();

    // Auto-connect after 3 seconds for demonstration / test responsiveness
    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 2800);

    return () => {
      clearTimeout(timer);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [callType]);

  // Duration timer when connected
  useEffect(() => {
    let interval: any = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!callee || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
      <div
        className={`relative w-full ${
          isFullscreen ? 'max-w-none h-full' : 'max-w-2xl h-[520px]'
        } rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-between shadow-2xl transition-all duration-300`}
      >
        {/* Top Floating Bar */}
        <div className="relative z-20 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={callee.avatar}
              alt={callee.fullName}
              className="w-10 h-10 rounded-full object-cover border border-white/40"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-sm font-bold text-white drop-shadow">
                {callee.fullName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="capitalize">{callType} Call</span>
                <span aria-hidden="true">·</span>
                {callStatus === 'connected' ? (
                  <span className="font-mono tabular-nums text-emerald-400 font-bold">
                    {formatDuration(duration)}
                  </span>
                ) : (
                  <span className="animate-pulse text-amber-400">Ringing...</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Center Canvas / Video Stage */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-900">
          {callType === 'video' && isVideoEnabled ? (
            <div className="relative w-full h-full">
              {/* Simulated Remote Video Stream */}
              <img
                src={callee.coverPhoto || '/src/assets/images/cover_landscape_aurora_1792752820966.jpg'}
                alt="Remote video"
                className="w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

              {/* Local PiP Video Box */}
              <div className="absolute bottom-20 right-4 w-36 h-48 rounded-2xl overflow-hidden border-2 border-white/60 shadow-2xl bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!localStream && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-800 text-white">
                    <img
                      src={currentUser.avatar}
                      alt="You"
                      className="w-10 h-10 rounded-full object-cover mb-1 border border-white/20"
                    />
                    <span className="text-[10px] text-slate-300">You (HD)</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Audio Call Screen with Waveform simulation
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <img
                  src={callee.avatar}
                  alt={callee.fullName}
                  className="w-28 h-28 rounded-full object-cover border-4 border-indigo-500 shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                {callStatus === 'connected' && (
                  <span className="absolute -bottom-1 -right-1 p-2 rounded-full bg-emerald-500 text-white shadow-md">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">{callee.fullName}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {callStatus === 'connected' ? 'Encrypted Audio Stream Active' : 'Connecting through STUN/WebSockets...'}
                </p>
              </div>

              {callStatus === 'connected' && (
                <div className="flex items-center gap-1.5 h-8">
                  {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-indigo-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="relative z-20 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-full transition-colors ${
              isMuted ? 'bg-rose-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-full transition-colors ${
                !isVideoEnabled ? 'bg-rose-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={isVideoEnabled ? 'Disable Camera' : 'Enable Camera'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={onEndCall}
            className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition-transform hover:scale-105"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
