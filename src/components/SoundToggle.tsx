'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sounds } from '@/lib/sound';

export function SoundToggle({ className = '' }: { className?: string }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(sounds.isMuted());
  }, []);

  const handleToggle = () => {
    const newMuted = sounds.toggleMute();
    setMuted(newMuted);
    if (!newMuted) {
      sounds.playAnswerLocked();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all duration-200 shadow-md flex items-center justify-center ${className}`}
      title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
      aria-label="Sound Toggle"
    >
      {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
    </button>
  );
}
