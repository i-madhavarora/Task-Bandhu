import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  CloudRain,
  Radio,
  Trees
} from 'lucide-react';
import { isApexPlan } from '../utils/planLimits';

const SOUNDSCAPES = [
  {
    id: 'lofi',
    title: 'Lo-Fi Chill Beats',
    desc: 'Soft rhythmic beats for ideation',
    icon: Radio,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  },
  {
    id: 'rain',
    title: 'Midnight Rain & Thunder',
    desc: 'Gentle rainfall for focus',
    icon: CloudRain,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_c97a8e5797.mp3?filename=soft-rain-ambient-111154.mp3'
  },
  {
    id: 'forest',
    title: 'Deep Forest Stream',
    desc: 'Natural flow & calm birdsong',
    icon: Trees,
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_924bb3e3a4.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3'
  }
];

export default function ApexSoundPlayer({
  isOpen,
  onClose,
  currentUser
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState(SOUNDSCAPES[0]);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  const isApex = isApexPlan(currentUser?.plan);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!isApex) return;
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.log('Audio autoplay prevented:', e));
    }
  };

  const selectTrack = (track) => {
    if (!isApex) return;
    setActiveTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-18 right-4 z-40 w-80 bg-slate-900/95 border border-white/[0.1] rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-right-4">
      <audio
        ref={audioRef}
        src={activeTrack.url}
        loop
      />

      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Music size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Focus Soundscapes</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ✦ Apex
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Binaural & ambient audio for deep ideation</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
        >
          <X size={15} />
        </button>
      </div>

      {/* Tracks */}
      <div className="p-3 space-y-1.5">
        {SOUNDSCAPES.map((t) => {
          const Icon = t.icon;
          const isCurrent = activeTrack.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => selectTrack(t)}
              className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                isCurrent && isPlaying
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.05] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${isCurrent ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/[0.06] text-slate-400'}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">{t.title}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.desc}</p>
                </div>
              </div>

              {isCurrent && isPlaying && (
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-amber-400 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-amber-400 rounded-full animate-pulse delay-150" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Playback Controls */}
      <div className="p-3 bg-slate-800/50 border-t border-white/[0.06] flex items-center justify-between gap-3">
        <button
          onClick={togglePlay}
          className={`flex items-center justify-center w-9 h-9 rounded-full shadow-md transition-all active:scale-95 ${
            isApex
              ? 'bg-amber-400 text-slate-950 font-black hover:bg-amber-300'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
          title={isApex ? (isPlaying ? 'Pause' : 'Play') : 'Apex Prestige required'}
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Volume slider */}
        <div className="flex items-center gap-2 flex-1">
          {volume === 0 ? <VolumeX size={14} className="text-slate-500" /> : <Volume2 size={14} className="text-slate-400" />}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {!isApex && (
        <div className="p-3 bg-amber-500/10 border-t border-amber-500/20 text-center">
          <p className="text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1">
            <Sparkles size={12} />
            <span>Soundscapes require an Apex Prestige plan</span>
          </p>
        </div>
      )}
    </div>
  );
}

