import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { AdminNav } from '@/components/AdminNav';
import { 
  Users, Database, Trophy, Play, PlusCircle, 
  ExternalLink, BarChart3, Clock, CheckCircle2, ArrowRight 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    totalQuestions,
    totalSessions,
    totalParticipants,
    recentSessions,
    allAnswers
  ] = await Promise.all([
    prisma.question.count({ where: { active: true } }),
    prisma.quizSession.count(),
    prisma.participant.count(),
    prisma.quizSession.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        questions: true,
        participants: true,
      },
    }),
    prisma.participantAnswer.findMany({
      select: { isCorrect: true, responseTimeMs: true },
    }),
  ]);

  const totalAnswerCount = allAnswers.length;
  const correctCount = allAnswers.filter((a) => a.isCorrect).length;
  const avgAccuracy = totalAnswerCount > 0 ? Math.round((correctCount / totalAnswerCount) * 100) : 0;
  const avgResponseTimeSec =
    totalAnswerCount > 0
      ? Number((allAnswers.reduce((sum, a) => sum + a.responseTimeMs, 0) / totalAnswerCount / 1000).toFixed(1))
      : 0;

  return (
    <div className="min-h-screen bg-[#0A0F24] text-white flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Welcome & Quick Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Dashboard Pelatihan &amp; Quiz
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Pantau jalannya kuis interaktif, statistik peserta, dan materi pemahaman etika
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/quiz/create"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Quiz Baru</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="arena-card p-5 border border-blue-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400">Total Soal Aktif</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalQuestions}</div>
            <div className="text-[11px] text-slate-400 mt-1">Dari bank soal Code of Conduct</div>
          </div>

          <div className="arena-card p-5 border border-emerald-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400">Sesi Quiz Terbuat</span>
              <Play className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{totalSessions}</div>
            <div className="text-[11px] text-slate-400 mt-1">Workshop &amp; pelatihan</div>
          </div>

          <div className="arena-card p-5 border border-purple-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400">Total Partisipan</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">{totalParticipants}</div>
            <div className="text-[11px] text-slate-400 mt-1">Karyawan &amp; peserta</div>
          </div>

          <div className="arena-card p-5 border border-amber-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400">Rata-rata Akurasi</span>
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{avgAccuracy}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Kecepatan rata-rata {avgResponseTimeSec}s</div>
          </div>
        </div>

        {/* Active & Recent Quizzes Table */}
        <div className="arena-card p-6 border border-slate-700/80 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Daftar Sesi Quiz Terbaru</h3>
              <p className="text-xs text-slate-400">Buka host projector console atau lihat riwayat leaderboard</p>
            </div>
            <Link
              href="/admin/quiz/create"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>+ Buat Baru</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Room Code</th>
                  <th className="py-3 px-4">Nama Quiz</th>
                  <th className="py-3 px-4">Jumlah Soal</th>
                  <th className="py-3 px-4">Peserta</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      {session.joinCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {session.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {session.questions.length} Soal
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {session.participants.length} Peserta
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          session.status === 'LIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : session.status === 'WAITING'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : session.status === 'PAUSED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 capitalize">
                      {session.gameMode.toLowerCase().replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/host/${session.joinCode}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                      >
                        <span>Host Screen</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
