'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Zap, Clock, CheckCircle2, XCircle, Trophy, Award, 
  Flame, BookOpen, ChevronRight, RotateCcw, AlertTriangle, 
  Users, TrendingUp, Sparkles, Check, ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundToggle } from '@/components/SoundToggle';
import { sounds } from '@/lib/sound';
import { RoomState, LeaderboardEntry } from '@/lib/quiz-hub';

export default function ParticipantRoomPage() {
  const params = useParams();
  const router = useRouter();
  const joinCode = (params?.code as string) || '';

  const [state, setState] = useState<RoomState | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');
  const [participantId, setParticipantId] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showReview, setShowReview] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<any[] | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);

  const prevRoundStateRef = useRef<string>('');
  const lastSecondRef = useRef<number>(-1);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Check participant credentials in sessionStorage
  useEffect(() => {
    if (!joinCode) return;
    const token = sessionStorage.getItem(`quizarena_token_${joinCode}`);
    const name = sessionStorage.getItem(`quizarena_name_${joinCode}`);
    const pid = sessionStorage.getItem(`quizarena_pid_${joinCode}`);

    if (!token) {
      router.push(`/join/${joinCode}`);
      return;
    }

    setSessionToken(token);
    setParticipantName(name || 'Participant');
    setParticipantId(pid || '');
  }, [joinCode, router]);

  // 2. Setup Server-Sent Events (SSE) stream with reconnection
  useEffect(() => {
    if (!joinCode || !sessionToken) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      eventSource = new EventSource(`/api/quiz/${joinCode}/stream`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

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
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connectSSE, 2500);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [joinCode, sessionToken]);

  // 3. Reset answer state when new question begins
  useEffect(() => {
    if (!state) return;

    const currentRound = state.roundState;
    const prevRound = prevRoundStateRef.current;
    prevRoundStateRef.current = currentRound;

    if (currentRound === 'QUESTION' && prevRound !== 'QUESTION') {
      setSelectedOption(null);
      setIsAnswerLocked(false);
      sounds.playQuizStart();
    } else if (currentRound === 'REVEAL' && prevRound !== 'REVEAL') {
      // Reveal sound
      const myEntry = state.leaderboard?.find((l) => l.participantId === participantId);
      const isCorrect = state.currentQuestion?.correctOptionKey === selectedOption;
      if (isCorrect) {
        sounds.playCorrect();
      } else {
        sounds.playIncorrect();
      }
    } else if (currentRound === 'LEADERBOARD' && prevRound !== 'LEADERBOARD') {
      sounds.playLeaderboard();
    } else if (currentRound === 'PODIUM' && prevRound !== 'PODIUM') {
      sounds.playPodium();
      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [state, participantId, selectedOption]);

  // 4. Client-side timer interpolation matching server timestamp
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

      // Play countdown sound on change
      if (seconds !== lastSecondRef.current && seconds <= 5 && seconds > 0) {
        sounds.playCountdownTick(seconds);
        lastSecondRef.current = seconds;
      }
    };

    updateTimer();
    timerIntervalRef.current = setInterval(updateTimer, 200);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [state?.roundState, state?.questionStartedAtServer, state?.questionTimeLimit]);

  // 5. Handle answer submission
  const handleSelectOption = async (optionKey: string) => {
    if (isAnswerLocked || !state?.currentQuestion || state.roundState !== 'QUESTION' || isSubmitting) {
      return;
    }

    setSelectedOption(optionKey);
    setIsAnswerLocked(true);
    sounds.playAnswerLocked();

    try {
      setIsSubmitting(true);
      await fetch(`/api/quiz/${joinCode}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          quizQuestionId: state.currentQuestion.id,
          selectedOptionKey: optionKey,
        }),
      });
    } catch (err) {
      console.error('Error sending answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Fetch review answers
  const handleLoadReview = async () => {
    try {
      setIsLoadingReview(true);
      const res = await fetch(`/api/quiz/${joinCode}/review?token=${sessionToken}`);
      const data = await res.json();
      setReviewData(data.questions || []);
      setShowReview(true);
    } catch (err) {
      console.error('Error fetching review:', err);
    } finally {
      setIsLoadingReview(false);
    }
  };

  // Avatar initials helper
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return fullName.slice(0, 2).toUpperCase();
  };

  // Find my current leaderboard entry
  const myEntry: LeaderboardEntry | undefined = state?.leaderboard?.find(
    (l) => l.participantId === participantId || l.name === participantName
  );

  return (
    <div className="min-h-screen flex flex-col justify-between p-3.5 sm:p-4 max-w-md mx-auto relative bg-[#0A0F24]">
      {/* Top App Bar */}
      <header className="flex justify-between items-center py-2 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide truncate max-w-[170px]">
              {state?.title || 'QUIZ ARENA'}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span>Code: <b className="text-cyan-400 font-mono">{joinCode}</b></span>
              <span>&bull;</span>
              <span className="text-slate-300 truncate max-w-[90px]">{participantName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isConnected && (
            <span className="text-[10px] bg-rose-500/20 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded-full animate-pulse">
              Reconnecting...
            </span>
          )}
          <SoundToggle />
        </div>
      </header>

      {/* Connection Notice Banner */}
      {!isConnected && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Koneksi terputus. Mencoba menghubungkan kembali... Skor Anda aman tersimpan.</span>
        </div>
      )}

      {/* STATE 1: LOBBY / WAITING ROOM */}
      {(!state || state.roundState === 'LOBBY' || state.status === 'WAITING') && (
        <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4 animate-bounce-short">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            You are in!
          </div>

          <h2 className="text-2xl font-black text-white mb-1">
            {participantName}
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Quiz akan segera dimulai oleh trainer...
          </p>

          {/* Joined participants roster */}
          <div className="w-full arena-card p-4 text-left border border-slate-700/60">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Participants Joined</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                {state?.participantsCount || 1} Players
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {state?.participants && state.participants.length > 0 ? (
                state.participants.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      p.name === participantName
                        ? 'bg-blue-600/30 border-blue-500/50 text-blue-200'
                        : 'bg-slate-800/80 border-slate-700/50 text-slate-300'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200">
                      {getInitials(p.name)}
                    </span>
                    <span className="truncate max-w-[120px]">{p.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic py-2">Menunggu peserta lain...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: QUESTION & ANSWERING */}
      {state && state.roundState === 'QUESTION' && state.currentQuestion && (
        <div className="flex-1 flex flex-col justify-between py-1 animate-fade-in">
          {/* Question Header & Timer */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-bold tracking-wider text-blue-400 uppercase">
                QUESTION {(state.currentQuestionIndex || 0) + 1} / {state.totalQuestions}
              </div>

              {/* Circular urgency indicator */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-all ${
                  timeLeft <= 5
                    ? 'timer-urgent bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-cyan-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Topic pill */}
            <div className="inline-block px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[11px] font-medium text-slate-300 mb-2">
              {state.currentQuestion.topic}
            </div>

            {/* Question Text */}
            <div className="arena-card p-4 mb-4 border border-blue-500/20">
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                {state.currentQuestion.questionText}
              </p>
            </div>
          </div>

          {/* Answer Options or Locked Screen */}
          <div className="space-y-2.5 pb-2">
            {isAnswerLocked ? (
              <div className="arena-card-glow p-6 text-center border-blue-500/40 my-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border-2 border-blue-400 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-black text-white">ANSWER LOCKED</h3>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  ✓ Jawaban diterima!
                </p>
                <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Menunggu peserta lain / waktu habis...</span>
                </p>

                {state.allowAnswerChange && (
                  <button
                    onClick={() => setIsAnswerLocked(false)}
                    className="mt-4 text-xs text-slate-400 hover:text-white underline transition"
                  >
                    Ganti Jawaban
                  </button>
                )}
              </div>
            ) : (
              state.currentQuestion.options.map((opt) => {
                const isSelected = selectedOption === opt.key;
                let btnClass = 'btn-option-a';
                if (opt.key === 'B') btnClass = 'btn-option-b';
                if (opt.key === 'C') btnClass = 'btn-option-c';
                if (opt.key === 'D') btnClass = 'btn-option-d';

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    disabled={isAnswerLocked}
                    className={`w-full min-h-[54px] p-3.5 rounded-xl text-left text-white font-medium text-xs sm:text-sm flex items-center gap-3 transition-all duration-150 ${btnClass} ${
                      isSelected ? 'ring-4 ring-white shadow-xl scale-[1.01]' : 'opacity-95'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-black/30 border border-white/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {opt.key}
                    </span>
                    <span className="flex-1 leading-snug">{opt.text}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* STATE 3: REVEAL (CORRECT ANSWER & EDUCATIONAL EXPLANATION) */}
      {state && state.roundState === 'REVEAL' && state.currentQuestion && (
        <div className="flex-1 flex flex-col justify-between py-1 overflow-y-auto animate-fade-in">
          <div>
            {/* Result Verdict Banner */}
            <div className="text-center mb-3">
              {selectedOption === state.currentQuestion.correctOptionKey ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  <div className="flex items-center justify-center gap-2 font-black text-lg">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <span>CORRECT! +1000 Pts</span>
                  </div>
                  <p className="text-[11px] text-emerald-200 mt-0.5">Bagus sekali, jawaban Anda tepat!</p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300">
                  <div className="flex items-center justify-center gap-2 font-black text-lg">
                    <XCircle className="w-6 h-6 text-rose-400" />
                    <span>INCORRECT! 0 Pts</span>
                  </div>
                  <p className="text-[11px] text-rose-200 mt-0.5">
                    {selectedOption ? `Pilihan Anda: ${selectedOption}` : 'Anda tidak sempat memilih'}
                  </p>
                </div>
              )}
            </div>

            {/* Correct Option Display */}
            <div className="arena-card p-3.5 mb-3 border border-emerald-500/40 bg-emerald-950/20">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Kunci Jawaban Benar
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {state.currentQuestion.correctOptionKey}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {state.currentQuestion.options.find((o) => o.key === state.currentQuestion?.correctOptionKey)?.text}
                </p>
              </div>
            </div>

            {/* Educational Insight Panel (Section 10) */}
            {state.currentQuestion.explanation && (
              <div className="arena-card p-3.5 mb-3 border border-indigo-500/30 bg-indigo-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>WHY THIS IS CORRECT</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {state.currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Answer Distribution (Section 11) */}
            {state.distribution && (
              <div className="arena-card p-3.5 border border-slate-700/60 mb-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                  <span>Answer Distribution</span>
                  <span className="text-cyan-400 font-mono text-[11px]">
                    {state.distribution.correctCount} / {state.distribution.total} answered correctly
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const count = state.distribution ? state.distribution[key] : 0;
                    const total = state.distribution ? state.distribution.total : 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const isKeyCorrect = key === state.currentQuestion?.correctOptionKey;

                    return (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className={`w-5 font-bold ${isKeyCorrect ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {key}
                        </span>
                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isKeyCorrect ? 'bg-emerald-500' : 'bg-blue-600/70'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-9 text-right font-mono text-[11px] text-slate-300">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800">
                  <span>Median Time: <b>{state.distribution.medianTimeSec}s</b></span>
                  <span>Fastest Correct: <b>{state.distribution.fastestTimeSec}s</b></span>
                </div>
              </div>
            )}
          </div>

          <div className="text-center py-2 text-xs text-slate-400">
            Menunggu trainer beralih ke Leaderboard...
          </div>
        </div>
      )}

      {/* STATE 4: LIVE LEADERBOARD (SECTION 14 & 15) */}
      {state && state.roundState === 'LEADERBOARD' && (
        <div className="flex-1 flex flex-col justify-between py-1 animate-fade-in">
          <div>
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Leaderboard</span>
              </div>
              <h2 className="text-xl font-black text-white">Peringkat Sementara</h2>
            </div>

            {/* My Personal Scorecard (Section 15) */}
            {myEntry && (
              <div className="arena-card-glow p-4 mb-4 border-cyan-500/40 bg-gradient-to-r from-blue-900/40 to-purple-900/40">
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  YOUR POSITION
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white font-mono">#{myEntry.rank}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{myEntry.name}</div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {myEntry.accuracy}% Accuracy ({myEntry.correctCount} Correct)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-amber-400 font-mono">
                      {myEntry.score.toLocaleString()}
                    </div>
                    {myEntry.currentStreak >= 2 && (
                      <div className="text-[10px] text-amber-300 font-bold flex items-center justify-end gap-1">
                        <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                        <span>{myEntry.currentStreak} Streak!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Top Leaderboard List */}
            <div className="arena-card p-3 border border-slate-700/60">
              <div className="text-xs font-semibold text-slate-400 mb-2 px-1">Top Players</div>
              <div className="space-y-1.5">
                {state.leaderboard?.slice(0, 5).map((entry) => {
                  const isMe = entry.participantId === participantId || entry.name === participantName;
                  let medal = '';
                  if (entry.rank === 1) medal = '🥇';
                  if (entry.rank === 2) medal = '🥈';
                  if (entry.rank === 3) medal = '🥉';

                  return (
                    <div
                      key={entry.participantId}
                      className={`flex justify-between items-center p-2.5 rounded-xl border transition-all ${
                        isMe
                          ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 text-center text-sm font-bold font-mono">
                          {medal || entry.rank}
                        </span>
                        <div className="truncate max-w-[130px] sm:max-w-[170px]">
                          <div className="text-xs truncate">{entry.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {entry.correctCount} benar &bull; {entry.avgTimeSec}s
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {entry.rankDelta > 0 && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center">
                            ↑{entry.rankDelta}
                          </span>
                        )}
                        {entry.rankDelta < 0 && (
                          <span className="text-[10px] font-bold text-rose-400 flex items-center">
                            ↓{Math.abs(entry.rankDelta)}
                          </span>
                        )}
                        <span className="text-xs font-black font-mono text-cyan-300">
                          {entry.score.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-center py-2 text-xs text-slate-400">
            Menunggu trainer beralih ke soal berikutnya...
          </div>
        </div>
      )}

      {/* STATE 5: FINAL WINNER PODIUM & RESULT (SECTIONS 16, 17, 18, 19) */}
      {state && (state.roundState === 'PODIUM' || state.status === 'FINISHED') && (
        <div className="flex-1 flex flex-col justify-between py-1 overflow-y-auto animate-fade-in">
          {showReview && reviewData ? (
            /* Review Answers Screen */
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <button
                  onClick={() => setShowReview(false)}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Podium</span>
                </button>
                <span className="text-xs font-bold text-cyan-400">REVIEW JAWABAN</span>
              </div>

              <div className="space-y-3">
                {reviewData.map((item) => (
                  <div key={item.number} className="arena-card p-3.5 border border-slate-700/70">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] font-bold uppercase text-blue-400">
                        Soal {item.number} &bull; {item.topic}
                      </span>
                      {item.isUserCorrect ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          ✓ CORRECT
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full">
                          ✗ INCORRECT
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-white mb-2">{item.questionText}</p>

                    <div className="text-[11px] space-y-1 mb-2">
                      <div className="text-slate-300">
                        Jawaban Anda: <b className={item.isUserCorrect ? 'text-emerald-400' : 'text-rose-400'}>{item.userAnswerKey || '-'}</b>
                      </div>
                      <div className="text-slate-300">
                        Kunci Benar: <b className="text-emerald-400">{item.correctKey}</b> &bull; {item.correctText}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-slate-200">
                      <b className="text-cyan-300">Penjelasan:</b> {item.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Winner Podium View */
            <div>
              <div className="text-center mb-4">
                <div className="inline-block p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 mb-2">
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">🏆 QUIZ COMPLETED</h2>
                <p className="text-xs text-slate-400 mt-0.5">Terima kasih telah berpartisipasi!</p>
              </div>

              {/* Podium Visual (Top 3) */}
              <div className="flex items-end justify-center gap-2 mb-6 pt-6">
                {/* 2nd place */}
                {state.leaderboard && state.leaderboard[1] && (
                  <div className="flex flex-col items-center w-24">
                    <span className="text-lg">🥈</span>
                    <span className="text-xs font-bold text-white truncate max-w-[80px]">
                      {state.leaderboard[1].name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {state.leaderboard[1].score.toLocaleString()}
                    </span>
                    <div className="w-full h-16 bg-slate-700/80 rounded-t-xl mt-1 border-t-2 border-slate-400 flex items-center justify-center font-bold text-sm text-slate-300">
                      2
                    </div>
                  </div>
                )}

                {/* 1st place */}
                {state.leaderboard && state.leaderboard[0] && (
                  <div className="flex flex-col items-center w-28">
                    <span className="text-2xl animate-bounce">🥇</span>
                    <span className="text-sm font-black text-amber-300 truncate max-w-[90px]">
                      {state.leaderboard[0].name}
                    </span>
                    <span className="text-xs text-amber-400 font-mono font-bold">
                      {state.leaderboard[0].score.toLocaleString()}
                    </span>
                    <div className="w-full h-24 bg-gradient-to-t from-amber-600/60 to-yellow-500/60 rounded-t-xl mt-1 border-t-2 border-yellow-300 flex items-center justify-center font-black text-lg text-yellow-100 shadow-lg shadow-amber-500/30">
                      1
                    </div>
                  </div>
                )}

                {/* 3rd place */}
                {state.leaderboard && state.leaderboard[2] && (
                  <div className="flex flex-col items-center w-24">
                    <span className="text-lg">🥉</span>
                    <span className="text-xs font-bold text-white truncate max-w-[80px]">
                      {state.leaderboard[2].name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {state.leaderboard[2].score.toLocaleString()}
                    </span>
                    <div className="w-full h-12 bg-amber-900/60 rounded-t-xl mt-1 border-t-2 border-amber-600 flex items-center justify-center font-bold text-xs text-amber-300">
                      3
                    </div>
                  </div>
                )}
              </div>

              {/* My Personal Final Stats */}
              {myEntry && (
                <div className="arena-card p-4 mb-4 border border-blue-500/30">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                    Hasil Pribadi Anda
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="p-2 rounded-lg bg-slate-900/60">
                      <div className="text-[10px] text-slate-400">Peringkat Akhir</div>
                      <div className="text-lg font-black text-white font-mono">#{myEntry.rank}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60">
                      <div className="text-[10px] text-slate-400">Total Skor</div>
                      <div className="text-lg font-black text-amber-400 font-mono">
                        {myEntry.score.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60">
                      <div className="text-[10px] text-slate-400">Akurasi</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {myEntry.accuracy}% ({myEntry.correctCount} / {myEntry.correctCount + myEntry.wrongCount})
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60">
                      <div className="text-[10px] text-slate-400">Rata-rata Waktu</div>
                      <div className="text-sm font-bold text-cyan-300 font-mono">
                        {myEntry.avgTimeSec}s
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pb-2">
                <button
                  onClick={handleLoadReview}
                  disabled={isLoadingReview}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{isLoadingReview ? 'Memuat Soal...' : 'REVIEW YOUR ANSWERS & EXPLANATIONS'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Branding */}
      <footer className="text-center text-[10px] text-slate-500 py-1 border-t border-slate-900">
        QUIZ ARENA &bull; Realtime Gamified Learning
      </footer>
    </div>
  );
}
