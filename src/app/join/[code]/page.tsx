'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Zap, User, Building, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { SoundToggle } from '@/components/SoundToggle';

export default function JoinCodePage() {
  const params = useParams();
  const router = useRouter();
  const codeParam = (params?.code as string) || '';

  const [joinCode, setJoinCode] = useState(codeParam);
  const [name, setName] = useState('');
  const [unitOrCompany, setUnitOrCompany] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (codeParam) {
      setJoinCode(codeParam);
    }
  }, [codeParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Mohon masukkan nama Anda.');
      return;
    }
    if (!joinCode.trim()) {
      setError('Mohon masukkan kode quiz.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanCode = joinCode.trim().replace(/\D/g, '');
      const existingToken = sessionStorage.getItem(`quizarena_token_${cleanCode}`);

      const res = await fetch(`/api/quiz/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          unitOrCompany: unitOrCompany.trim() || undefined,
          email: email.trim() || undefined,
          existingToken: existingToken || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal bergabung ke quiz.');
      }

      // Store session token and metadata
      sessionStorage.setItem(`quizarena_token_${cleanCode}`, data.participant.sessionToken);
      sessionStorage.setItem(`quizarena_name_${cleanCode}`, data.participant.name);
      sessionStorage.setItem(`quizarena_pid_${cleanCode}`, data.participant.id);

      router.push(`/room/${cleanCode}`);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 relative overflow-hidden bg-gradient-to-br from-[#0A0F24] via-[#0E1738] to-[#060918]">
      {/* Top bar */}
      <div className="flex justify-between items-center max-w-md w-full mx-auto py-2">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">QUIZ ARENA</span>
        </button>
        <SoundToggle />
      </div>

      {/* Main Join Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="arena-card p-6 md:p-8 shadow-2xl border border-blue-500/30">
          <div className="text-center mb-6">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Registration
            </div>
            <h2 className="text-2xl font-black text-white">Gabung ke Quiz</h2>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan nama &amp; kode room untuk mulai menjawab
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Room Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="784921"
                className="w-full text-center text-xl font-mono tracking-widest py-2.5 px-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Lengkap / Panggilan <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Teguh Budiarto"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Unit Kerja / Perusahaan <span className="text-slate-500 text-[10px]">(Opsional)</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={unitOrCompany}
                  onChange={(e) => setUnitOrCompany(e.target.value)}
                  placeholder="Contoh: Divisi Kepatuhan / PT Bank XYZ"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email <span className="text-slate-500 text-[10px]">(Opsional untuk sertifikat)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teguh@perusahaan.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghubungkan...</span>
                </>
              ) : (
                <>
                  <span>MASUK ARENA QUIZ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-500 py-2">
        Akses cepat smartphone &bull; Tanpa login ribet
      </footer>
    </main>
  );
}
