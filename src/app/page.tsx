'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Play, Shield, Users, Trophy, BarChart3, ArrowRight } from 'lucide-react';
import { SoundToggle } from '@/components/SoundToggle';

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().replace(/\D/g, '');
    if (!cleanCode || cleanCode.length < 4) {
      setError('Masukkan kode quiz yang valid (minimal 4 digit)');
      return;
    }
    router.push(`/join/${cleanCode}`);
  };

  const handleQuickDemo = () => {
    router.push('/join/784921');
  };

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 md:p-8 relative overflow-hidden bg-gradient-to-br from-[#0A0F24] via-[#0E1738] to-[#060918]">
      {/* Glow Orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center max-w-6xl w-full mx-auto z-10 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              QUIZ ARENA
            </h1>
            <p className="text-xs text-slate-400">Interactive Training Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SoundToggle />
          <button
            onClick={() => router.push('/admin/login')}
            className="text-xs md:text-sm px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition font-medium"
          >
            Trainer / Admin
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full my-8 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
          <Zap className="w-3.5 h-3.5" />
          Gamified Corporate Learning
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Quiz Training yang <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">Cepat & Kompetitif</span>
        </h2>

        <p className="text-slate-300 text-sm md:text-base mb-8 max-w-lg leading-relaxed">
          Platform interaktif untuk workshop, seminar, sertifikasi, dan kelas corporate. Real-time scoring, mobile-friendly, dan edukatif!
        </p>

        {/* Enter Code Card */}
        <div className="w-full max-w-md arena-card p-6 md:p-8 shadow-2xl border border-blue-500/30">
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Punya Room Code?
              </label>
              <div className="relative">
                <input
                  id="roomCode"
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="Contoh: 784921"
                  className="w-full text-center text-2xl md:text-3xl font-mono tracking-widest py-3.5 px-4 rounded-xl bg-slate-900/90 border-2 border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition"
                  autoComplete="off"
                />
              </div>
              {error && <p className="text-rose-400 text-xs mt-2 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>GABUNG QUIZ</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col gap-2">
            <button
              onClick={handleQuickDemo}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white text-xs font-medium transition flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>Demo Cepat: Code of Conduct Challenge (784921)</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-10 w-full max-w-2xl text-left">
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <Shield className="w-5 h-5 text-blue-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Fair Scoring</h4>
            <p className="text-[11px] text-slate-400">Akurasi &gt; Kecepatan dengan server timestamp</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <Zap className="w-5 h-5 text-amber-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Sub-50ms Sync</h4>
            <p className="text-[11px] text-slate-400">Realtime sync host projector &amp; smartphone</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <Trophy className="w-5 h-5 text-purple-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Live Leaderboard</h4>
            <p className="text-[11px] text-slate-400">Peringkat dinamis &amp; grand podium animasi</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <BarChart3 className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Learning Insights</h4>
            <p className="text-[11px] text-slate-400">Analisis topik &amp; edukasi &quot;Why This Is Correct&quot;</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-2 border-t border-slate-900 z-10">
        QUIZ ARENA &copy; 2026 &bull; Interactive Training &amp; Learning Platform
      </footer>
    </main>
  );
}
