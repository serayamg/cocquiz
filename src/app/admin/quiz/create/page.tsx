'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { 
  PlusCircle, Check, ArrowRight, ArrowLeft, Clock, 
  HelpCircle, Settings, Users, Zap, Shield, Sparkles, Loader2 
} from 'lucide-react';

export default function CreateQuizWizardPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Quiz Info
  const [title, setTitle] = useState('CODE OF CONDUCT CHALLENGE');
  const [questionBankId, setQuestionBankId] = useState('');
  const [banks, setBanks] = useState<{ id: string; title: string }[]>([]);

  // Step 2: Choose Questions
  const [selectionMode, setSelectionMode] = useState<'RANDOM' | 'SEQUENTIAL' | 'MANUAL'>('RANDOM');
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(['LOW', 'MEDIUM_LOW', 'MEDIUM']);

  // Step 3: Game Rules
  const [gameMode, setGameMode] = useState<'CLASSIC' | 'SPEED_CHALLENGE' | 'LEARNING_MODE' | 'TEAM_BATTLE'>('CLASSIC');

  // Step 4: Timer & Score
  const [questionTimeLimit, setQuestionTimeLimit] = useState(20);
  const [randomizeAnswers, setRandomizeAnswers] = useState(false);

  // Step 5: Participant Settings
  const [allowNickname, setAllowNickname] = useState(false);
  const [allowAnswerChange, setAllowAnswerChange] = useState(false);

  // Fetch banks & topics
  useEffect(() => {
    fetch('/api/admin/questions')
      .then((res) => res.json())
      .then((data) => {
        if (data.banks && data.banks.length > 0) {
          setBanks(data.banks);
          setQuestionBankId(data.banks[0].id);
        }
        if (data.topics) {
          setAvailableTopics(data.topics);
          setSelectedTopics(data.topics);
        }
      })
      .catch(console.error);
  }, []);

  const handleLaunch = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/quiz/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          questionBankId,
          questionCount,
          selectionMode,
          topics: selectedTopics,
          difficulties: selectedDifficulties,
          gameMode,
          questionTimeLimit,
          randomAnswers: randomizeAnswers,
          allowNickname,
          allowAnswerChange,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat sesi quiz.');
      }

      router.push(`/host/${data.quiz.joinCode}`);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Quiz Info' },
    { num: 2, title: 'Pilih Soal' },
    { num: 3, title: 'Game Mode' },
    { num: 4, title: 'Waktu & Skor' },
    { num: 5, title: 'Peserta' },
    { num: 6, title: 'Review' },
    { num: 7, title: 'Launch' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F24] text-white flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create Quiz Wizard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Konfigurasi 7 langkah untuk meluncurkan sesi kuis training interaktif
          </p>
        </div>

        {/* Stepper Header */}
        <div className="arena-card p-4 border border-slate-800 mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold transition ${
                    currentStep === s.num
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                      : currentStep > s.num
                      ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`ml-2 text-xs font-medium ${currentStep === s.num ? 'text-white' : 'text-slate-400'}`}>
                  {s.title}
                </span>
                {idx < steps.length - 1 && (
                  <div className="w-6 sm:w-10 h-0.5 bg-slate-800 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Card Body */}
        <div className="arena-card p-6 sm:p-8 border border-blue-500/30 shadow-2xl mb-6">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: QUIZ INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-2">Langkah 1: Informasi Quiz</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama / Judul Sesi Quiz <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: CODE OF CONDUCT CHALLENGE"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Bank Soal Induk
                </label>
                <select
                  value={questionBankId}
                  onChange={(e) => setQuestionBankId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE QUESTIONS */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-2">Langkah 2: Pemilihan Soal</h2>
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Metode Pemilihan Soal
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'RANDOM', title: '● Random Selection', desc: 'Soal diacak otomatis oleh sistem' },
                    { id: 'SEQUENTIAL', title: '○ Sequential Selection', desc: 'Soal urut sesuai urutan bank soal' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSelectionMode(mode.id as any)}
                      className={`p-3.5 rounded-xl text-left border transition ${
                        selectionMode === mode.id
                          ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{mode.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Jumlah Soal yang Digunakan
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition ${
                        questionCount === cnt
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {cnt} Soal
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.max(1, Number(e.target.value)))}
                    className="w-24 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Filter Tingkat Kesulitan
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'LOW', label: 'Low (Rendah)' },
                    { key: 'MEDIUM_LOW', label: 'Medium-Low' },
                    { key: 'MEDIUM', label: 'Medium (Case-Based)' },
                  ].map((d) => {
                    const checked = selectedDifficulties.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          if (checked) {
                            if (selectedDifficulties.length > 1) {
                              setSelectedDifficulties(selectedDifficulties.filter((k) => k !== d.key));
                            }
                          } else {
                            setSelectedDifficulties([...selectedDifficulties, d.key]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          checked
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {checked ? '☑ ' : '☐ '} {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: GAME RULES */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-2">Langkah 3: Game Mode</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'CLASSIC',
                    title: 'MODE 1: Classic Quiz',
                    desc: 'Semua peserta menjawab soal yang sama dengan server timing standar.',
                  },
                  {
                    id: 'SPEED_CHALLENGE',
                    title: 'MODE 2: Speed Challenge',
                    desc: 'Bonus kecepatan lebih tinggi (hingga 750 poin) untuk jawaban cepat.',
                  },
                  {
                    id: 'LEARNING_MODE',
                    title: 'MODE 3: Learning Mode',
                    desc: 'Setiap soal diulas mendalam beserta penjelasan komprehensif.',
                  },
                  {
                    id: 'TEAM_BATTLE',
                    title: 'MODE 4: Team Battle',
                    desc: 'Peserta dapat dikelompokkan ke dalam tim dan skor diakumulasikan.',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setGameMode(mode.id as any)}
                    className={`p-4 rounded-xl text-left border transition ${
                      gameMode === mode.id
                        ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-400'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-1">{mode.title}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: TIMER & SCORING */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-2">Langkah 4: Waktu &amp; Skor</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Waktu Menjawab Tiap Soal (Answer Time)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 20, 30, 45, 60].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setQuestionTimeLimit(t)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition ${
                        questionTimeLimit === t
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {t} Detik {t === 20 && '(Default)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={randomizeAnswers}
                    onChange={(e) => setRandomizeAnswers(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Randomize Answer Options (Acak Opsi Jawaban)</div>
                    <div className="text-[11px] text-slate-400">Posisi opsi diacak tanpa mengubah kunci jawaban</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: PARTICIPANT SETTINGS */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-2">Langkah 5: Pengaturan Partisipan</h2>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowNickname}
                    onChange={(e) => setAllowNickname(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Izinkan Nickname (Allow Nickname)</div>
                    <div className="text-[11px] text-slate-400">
                      Peserta dapat memilih nama panggilan / alias
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAnswerChange}
                    onChange={(e) => setAllowAnswerChange(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Izinkan Penggantian Jawaban Sebelum Waktu Habis</div>
                    <div className="text-[11px] text-slate-400">
                      Jika dinonaktifkan, jawaban langsung terkunci (Answer Locked)
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW CONFIGURATION */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-2">Langkah 6: Tinjau Konfigurasi Quiz</h2>
              <div className="arena-card p-4 border border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Judul Quiz:</span>
                  <span className="font-bold text-white">{title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Jumlah Soal:</span>
                  <span className="font-bold text-cyan-300 font-mono">{questionCount} Soal ({selectionMode})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Game Mode:</span>
                  <span className="font-bold text-emerald-400">{gameMode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Waktu Jawab Tiap Soal:</span>
                  <span className="font-bold text-amber-400 font-mono">{questionTimeLimit} Detik</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Answer Change:</span>
                  <span className="font-bold text-white">{allowAnswerChange ? 'Diizinkan' : 'Terkunci (Locked)'}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: LAUNCH */}
          {currentStep === 7 && (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Siap Meluncurkan Quiz!</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto mb-6">
                Sistem akan membuat Room Code 6-digit baru dan langsung mengarahkan Anda ke layar Host Projector Screen.
              </p>
              <button
                onClick={handleLaunch}
                disabled={isLoading}
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2 mx-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Membuat Room Quiz...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-white" />
                    <span>LUNCURKAN QUIZ SEKARANG (LAUNCH)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Wizard Controls Bottom */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-800">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            ) : <div />}

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
