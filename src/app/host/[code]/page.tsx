'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Zap, Clock, Users, Play, Pause, FastForward, Trophy, Award, 
  BarChart3, CheckCircle2, ChevronRight, X, UserX, AlertCircle, 
  BookOpen, Sparkles, RefreshCw, Volume2, Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundToggle } from '@/components/SoundToggle';
import { sounds } from '@/lib/sound';
import { RoomState } from '@/lib/quiz-hub';

export default function HostScreenPage() {
  const params = useParams();
  const router = useRouter();
  const joinCode = (params?.code as string) || '';

  const [state, setState] = useState<RoomState | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showEndConfirm, setShowEndConfirm] = useState<boolean>(false);
  const [joinUrl, setJoinUrl] = useState<string>('');

  const prevRoundStateRef = useRef<string>('');
  const lastSecondRef = useRef<number>(-1);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Determine join URL for QR code
  useEffect(() => {
    if (typeof window !== 'undefined' && joinCode) {
      setJoinUrl(`${window.location.origin}/join/${joinCode}`);
    }
  }, [joinCode]);

  // 2. Connect to SSE stream
  useEffect(() => {
    if (!joinCode) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      eventSource = new EventSource(`/api/quiz/${joinCode}/stream?role=host`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'INITIAL_STATE' || payload.type === 'STATE_UPDATE') {
            setState(payload.state);
          }
        } catch (err) {
          console.error('Failed to parse SSE payload:', err);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
        reconnectTimeout = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [joinCode]);

  // 3. Audio & Transition triggers
  useEffect(() => {
    if (!state) return;

    const currentRound = state.roundState;
    const prevRound = prevRoundStateRef.current;
    prevRoundStateRef.current = currentRound;

    if (currentRound === 'QUESTION' && prevRound !== 'QUESTION') {
      sounds.playQuizStart();
    } else if (currentRound === 'REVEAL' && prevRound !== 'REVEAL') {
      sounds.playCorrect();
    } else if (currentRound === 'LEADERBOARD' && prevRound !== 'LEADERBOARD') {
      sounds.playLeaderboard();
    } else if (currentRound === 'PODIUM' && prevRound !== 'PODIUM') {
      sounds.playPodium();
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      });
    }
  }, [state]);

  // 4. Host Synchronized Timer
  useEffect(() => {
    if (!state || state.roundState !== 'QUESTION' || !state.questionStartedAtServer) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const durationMs = state.questionTimeLimit * 1000;
    const startedAt = state.questionStartedAtServer;

    const updateTimer = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      const seconds = Math.ceil(remaining / 1000);
      setTimeLeft(seconds);

      if (seconds !== lastSecondRef.current && seconds <= 5 && seconds > 0) {
        sounds.playCountdownTick(seconds);
        lastSecondRef.current = seconds;
      }

      // Auto-trigger show answer when timer ends or all participants answered
      if (remaining <= 0 && state.roundState === 'QUESTION') {
        clearInterval(timerIntervalRef.current!);
        handleAction('SHOW_ANSWER');
      }
    };

    updateTimer();
    timerIntervalRef.current = setInterval(updateTimer, 200);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [state?.roundState, state?.questionStartedAtServer, state?.questionTimeLimit]);

  // Check if all participants answered -> automatically reveal
  useEffect(() => {
    if (
      state &&
      state.roundState === 'QUESTION' &&
      state.participantsCount > 0 &&
      state.answersReceivedCount >= state.participantsCount
    ) {
      handleAction('SHOW_ANSWER');
    }
  }, [state?.answersReceivedCount, state?.participantsCount, state?.roundState]);

  // 5. Host Action Dispatcher
  const handleAction = async (action: string, payload?: { participantId?: string }) => {
    try {
      setIsLoading(true);
      await fetch(`/api/quiz/${joinCode}/host-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
    } catch (err) {
      console.error('Error executing host action:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#0A0F24] text-white flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Top Projector Bar */}
      <header className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold uppercase tracking-wider">
                TRAINER PROJECTOR VIEW
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Room: <b className="text-cyan-400 text-sm font-bold">{joinCode}</b>
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">{state?.title || 'QUIZ ARENA'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SoundToggle />
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Admin Dashboard
          </button>
        </div>
      </header>

      {/* ROUND STATE: LOBBY / WAITING ROOM */}
      {(!state || state.roundState === 'LOBBY' || state.status === 'WAITING') && (
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 my-6 max-w-6xl mx-auto w-full">
          {/* Left: QR Code & Join Instructions */}
          <div className="arena-card p-6 md:p-8 flex flex-col items-center text-center max-w-sm w-full border border-blue-500/30">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
              SCAN TO JOIN
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-xl mb-4">
              {joinUrl ? (
                <QRCodeSVG value={joinUrl} size={180} level="M" />
              ) : (
                <div className="w-[180px] h-[180px] bg-slate-200 animate-pulse rounded-lg" />
              )}
            </div>

            <div className="text-slate-400 text-xs mb-1">Atau buka di browser:</div>
            <div className="text-xs font-mono text-cyan-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 mb-4 truncate max-w-full">
              {joinUrl}
            </div>

            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">QUIZ CODE</div>
            <div className="text-4xl font-mono font-black tracking-widest text-white bg-blue-950/60 border border-blue-500/40 px-6 py-2 rounded-xl">
              {joinCode}
            </div>
          </div>

          {/* Right: Joined Participants Roster & Big Start Button */}
          <div className="flex-1 flex flex-col justify-between arena-card p-6 md:p-8 w-full max-w-xl min-h-[420px] border border-blue-500/30">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">Participants Ready</h3>
                </div>
                <div className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  {state?.participantsCount || 0} Players Joined
                </div>
              </div>

              {/* Avatar list */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {state?.participants && state.participants.length > 0 ? (
                  state.participants.map((p) => (
                    <div
                      key={p.id}
                      className="group flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {getInitials(p.name)}
                        </span>
                        <div className="truncate">
                          <div className="font-semibold truncate">{p.name}</div>
                          {p.unitOrCompany && (
                            <div className="text-[10px] text-slate-400 truncate">{p.unitOrCompany}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAction('KICK_PARTICIPANT', { participantId: p.id })}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition"
                        title="Kick participant"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-400 text-sm italic">
                    Menunggu peserta memindai QR Code atau memasukkan Room Code...
                  </div>
                )}
              </div>
            </div>

            {/* Giant Start Button */}
            <div className="pt-6">
              <button
                onClick={() => handleAction('START')}
                disabled={isLoading}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black text-xl shadow-xl shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6 fill-white" />
                <span>MULAI QUIZ (START QUIZ)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROUND STATE: QUESTION */}
      {state && state.roundState === 'QUESTION' && state.currentQuestion && (
        <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full my-4 animate-fade-in">
          {/* Question Meta & Timer Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black px-3.5 py-1 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                SOAL {(state.currentQuestionIndex || 0) + 1} / {state.totalQuestions}
              </span>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-cyan-300">
                {state.currentQuestion.topic}
              </span>
            </div>

            {/* Huge Circular Urgency Timer */}
            <div
              className={`flex items-center gap-2.5 px-5 py-2 rounded-2xl border-2 font-mono font-black text-2xl transition-all ${
                timeLeft <= 5
                  ? 'timer-urgent bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-slate-800/90 border-cyan-500 text-cyan-300'
              }`}
            >
              <Clock className="w-6 h-6" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Question Text Box */}
          <div className="arena-card p-6 md:p-8 border border-blue-500/30 mb-6">
            <p className="text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed text-white">
              {state.currentQuestion.questionText}
            </p>
          </div>

          {/* 4 Large Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {state.currentQuestion.options.map((opt) => {
              let bgClass = 'btn-option-a';
              if (opt.key === 'B') bgClass = 'btn-option-b';
              if (opt.key === 'C') bgClass = 'btn-option-c';
              if (opt.key === 'D') bgClass = 'btn-option-d';

              return (
                <div
                  key={opt.key}
                  className={`p-5 rounded-2xl flex items-center gap-4 text-white text-base md:text-lg font-semibold shadow-lg ${bgClass}`}
                >
                  <span className="w-10 h-10 rounded-xl bg-black/30 border border-white/30 flex items-center justify-center font-black text-base flex-shrink-0">
                    {opt.key}
                  </span>
                  <span className="leading-snug">{opt.text}</span>
                </div>
              );
            })}
          </div>

          {/* Realtime Answer Counter Bar */}
          <div className="arena-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-400" />
              <div className="text-base font-bold text-white">
                <span className="text-cyan-400 font-mono text-xl">{state.answersReceivedCount}</span> /{' '}
                <span className="font-mono">{state.participantsCount}</span> ANSWERED
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('SHOW_ANSWER')}
                disabled={isLoading}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                <span>SHOW ANSWER</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROUND STATE: REVEAL (ANSWER DISTRIBUTION & EXPLANATION) */}
      {state && state.roundState === 'REVEAL' && state.currentQuestion && (
        <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full my-4 animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              JAWABAN &amp; STATISTIK
            </span>
            <button
              onClick={() => handleAction('SHOW_LEADERBOARD')}
              disabled={isLoading}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
            >
              <span>LIHAT LEADERBOARD</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Correct Answer Banner */}
          <div className="arena-card p-6 border-2 border-emerald-500/50 bg-emerald-950/20 mb-4">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
              CORRECT ANSWER
            </div>
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center flex-shrink-0">
                {state.currentQuestion.correctOptionKey}
              </span>
              <div className="text-lg md:text-xl font-bold text-white leading-relaxed">
                {state.currentQuestion.options.find((o) => o.key === state.currentQuestion?.correctOptionKey)?.text}
              </div>
            </div>
          </div>

          {/* Educational Insight Card (Section 10) */}
          {state.currentQuestion.explanation && (
            <div className="arena-card p-5 border border-indigo-500/40 bg-indigo-950/20 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>WHY THIS IS CORRECT (EDUCATIONAL INSIGHT)</span>
              </div>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
                {state.currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Answer Distribution Bars (Section 11) */}
          {state.distribution && (
            <div className="arena-card p-6 border border-slate-700/80 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Answer Distribution
                </h4>
                <div className="text-xs font-mono font-bold text-cyan-300">
                  {state.distribution.correctCount} / {state.distribution.total} players answered correctly
                </div>
              </div>

              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                  const count = state.distribution ? state.distribution[key] : 0;
                  const total = state.distribution ? state.distribution.total : 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const isKeyCorrect = key === state.currentQuestion?.correctOptionKey;

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className={isKeyCorrect ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          Option {key} {isKeyCorrect && '✓ (Kunci)'}
                        </span>
                        <span className="font-mono text-slate-300">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isKeyCorrect ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-blue-600/70'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800">
                <span>Median Answer Time: <b className="text-white font-mono">{state.distribution.medianTimeSec}s</b></span>
                <span>Fastest Correct Answer: <b className="text-emerald-400 font-mono">{state.distribution.fastestTimeSec}s</b></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ROUND STATE: LEADERBOARD */}
      {state && state.roundState === 'LEADERBOARD' && (
        <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full my-4 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>TOP PLAYERS</span>
              </div>
              <h2 className="text-2xl font-black text-white">Live Leaderboard</h2>
            </div>

            <button
              onClick={() => handleAction('NEXT_QUESTION')}
              disabled={isLoading}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <span>
                {state.currentQuestionIndex + 1 >= state.totalQuestions
                  ? 'SELESAIKAN QUIZ (FINISH)'
                  : 'SOAL BERIKUTNYA (NEXT)'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Animated Top Leaderboard Table */}
          <div className="arena-card p-6 border border-slate-700/80 mb-6">
            <div className="space-y-3">
              {state.leaderboard?.slice(0, 5).map((entry, idx) => {
                let badge = `${entry.rank}`;
                let rowBg = 'bg-slate-900/70 border-slate-800';
                if (entry.rank === 1) {
                  badge = '🥇';
                  rowBg = 'bg-amber-950/30 border-amber-500/40 text-amber-100';
                } else if (entry.rank === 2) {
                  badge = '🥈';
                  rowBg = 'bg-slate-800/60 border-slate-600 text-slate-100';
                } else if (entry.rank === 3) {
                  badge = '🥉';
                  rowBg = 'bg-amber-950/20 border-amber-700/40 text-amber-200';
                }

                return (
                  <div
                    key={entry.participantId}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${rowBg}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 text-center text-xl font-bold font-mono">
                        {badge}
                      </span>
                      <div>
                        <div className="text-base md:text-lg font-bold text-white">
                          {entry.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {entry.unitOrCompany || 'Peserta'} &bull; {entry.correctCount} Benar &bull; {entry.accuracy}% Akurasi
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {entry.rankDelta > 0 && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-md">
                          ↑{entry.rankDelta}
                        </span>
                      )}
                      {entry.rankDelta < 0 && (
                        <span className="text-xs font-bold text-rose-400 bg-rose-500/20 px-2 py-1 rounded-md">
                          ↓{Math.abs(entry.rankDelta)}
                        </span>
                      )}
                      <span className="text-xl md:text-2xl font-black font-mono text-cyan-300">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ROUND STATE: PODIUM / QUIZ FINISHED */}
      {state && (state.roundState === 'PODIUM' || state.status === 'FINISHED') && (
        <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full my-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-block p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 mb-2">
              <Trophy className="w-12 h-12 text-amber-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">🏆 QUIZ COMPLETED</h2>
            <p className="text-sm text-slate-400 mt-1">Selamat kepada seluruh pemenang dan peserta!</p>
          </div>

          {/* Grand Winner Podium (Top 3) */}
          <div className="flex items-end justify-center gap-4 md:gap-8 mb-8 pt-8">
            {/* 2nd place */}
            {state.leaderboard && state.leaderboard[1] && (
              <div className="flex flex-col items-center w-36 md:w-44">
                <span className="text-3xl">🥈</span>
                <span className="text-sm md:text-base font-bold text-white truncate max-w-full text-center mt-1">
                  {state.leaderboard[1].name}
                </span>
                <span className="text-xs text-slate-400 font-mono font-semibold">
                  {state.leaderboard[1].score.toLocaleString()}
                </span>
                <div className="w-full h-28 bg-slate-700/80 rounded-t-2xl mt-2 border-t-4 border-slate-400 flex items-center justify-center font-bold text-xl text-slate-200 shadow-xl">
                  2
                </div>
              </div>
            )}

            {/* 1st place */}
            {state.leaderboard && state.leaderboard[0] && (
              <div className="flex flex-col items-center w-44 md:w-52">
                <span className="text-4xl animate-bounce">🥇</span>
                <span className="text-base md:text-lg font-black text-amber-300 truncate max-w-full text-center mt-1">
                  {state.leaderboard[0].name}
                </span>
                <span className="text-sm text-amber-400 font-mono font-black">
                  {state.leaderboard[0].score.toLocaleString()}
                </span>
                <div className="w-full h-40 bg-gradient-to-t from-amber-600 to-yellow-500 rounded-t-2xl mt-2 border-t-4 border-yellow-200 flex items-center justify-center font-black text-3xl text-yellow-950 shadow-2xl shadow-amber-500/40">
                  1
                </div>
              </div>
            )}

            {/* 3rd place */}
            {state.leaderboard && state.leaderboard[2] && (
              <div className="flex flex-col items-center w-36 md:w-44">
                <span className="text-3xl">🥉</span>
                <span className="text-sm md:text-base font-bold text-white truncate max-w-full text-center mt-1">
                  {state.leaderboard[2].name}
                </span>
                <span className="text-xs text-slate-400 font-mono font-semibold">
                  {state.leaderboard[2].score.toLocaleString()}
                </span>
                <div className="w-full h-20 bg-amber-900/70 rounded-t-2xl mt-2 border-t-4 border-amber-600 flex items-center justify-center font-bold text-lg text-amber-300 shadow-xl">
                  3
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`/api/admin/export?code=${joinCode}&type=leaderboard`}
              className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>EXPORT RESULT (CSV)</span>
            </a>
            <button
              onClick={() => router.push('/admin/analytics')}
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>VIEW TRAINING ANALYTICS</span>
            </button>
          </div>
        </div>
      )}

      {/* Host Bottom Floating Controls (Section 53) */}
      <footer className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <span className="font-bold text-cyan-400 font-mono uppercase">{state?.status || 'WAITING'}</span>
          <span>&bull;</span>
          <span>Round:</span>
          <span className="font-bold text-slate-300 font-mono uppercase">{state?.roundState || 'LOBBY'}</span>
        </div>

        <div className="flex items-center gap-2">
          {state?.status === 'LIVE' ? (
            <button
              onClick={() => handleAction('PAUSE')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Pause
            </button>
          ) : state?.status === 'PAUSED' ? (
            <button
              onClick={() => handleAction('RESUME')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              Resume
            </button>
          ) : null}

          {state?.status !== 'FINISHED' && (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold transition"
            >
              End Quiz
            </button>
          )}
        </div>
      </footer>

      {/* End Quiz Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="arena-card p-6 max-w-sm w-full border border-rose-500/40">
            <h3 className="text-lg font-bold text-white mb-2">Akhiri Quiz?</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Apakah Anda yakin ingin mengakhiri sesi quiz ini sekarang dan menampilkan podium pemenang?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  handleAction('END_QUIZ');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition"
              >
                Ya, Akhiri Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
