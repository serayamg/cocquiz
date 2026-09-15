import React from 'react';
import { prisma } from '@/lib/prisma';
import { AdminNav } from '@/components/AdminNav';
import { FileText, Download, Users, Trophy, Calendar, Database } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const sessions = await prisma.quizSession.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      participants: true,
      questions: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#0A0F24] text-white flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-400" />
            <span>Reports &amp; Data Export</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Unduh laporan kehadiran peserta, rekap leaderboard, dan analisis performa training dalam format CSV
          </p>
        </div>

        {/* Global Quick Export Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="arena-card p-5 border border-blue-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                <Trophy className="w-4 h-4" />
                <span>Leaderboard Rekapitulasi</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Unduh seluruh data peringkat, skor, akurasi, dan kecepatan rata-rata seluruh partisipan.
              </p>
            </div>
            <a
              href="/api/admin/export?type=leaderboard"
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Leaderboard (CSV)</span>
            </a>
          </div>

          <div className="arena-card p-5 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                <Users className="w-4 h-4" />
                <span>Attendance / Kehadiran</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Daftar absensi otomatis: Nama, Unit Kerja, Email, waktu join, skor akhir dan akurasi.
              </p>
            </div>
            <a
              href="/api/admin/export?type=attendance"
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Attendance (CSV)</span>
            </a>
          </div>

          <div className="arena-card p-5 border border-purple-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                <Database className="w-4 h-4" />
                <span>Database Bank Soal</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Unduh seluruh 15 butir soal Code of Conduct beserta opsi A-D, kunci jawaban dan penjelasan.
              </p>
            </div>
            <a
              href="/api/admin/export?type=questions"
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Bank Soal (CSV)</span>
            </a>
          </div>
        </div>

        {/* Sesi Spesifik Table */}
        <div className="arena-card p-6 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-1">Export per Sesi Quiz</h3>
          <p className="text-xs text-slate-400 mb-4">
            Unduh laporan individual per sesi workshop atau batch pelatihan
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Room Code</th>
                  <th className="py-3 px-4">Judul Sesi</th>
                  <th className="py-3 px-4">Tanggal Dibuat</th>
                  <th className="py-3 px-4">Total Peserta</th>
                  <th className="py-3 px-4 text-right">Aksi Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      {s.joinCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {s.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(s.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {s.participants.length} Peserta
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <a
                        href={`/api/admin/export?code=${s.joinCode}&type=leaderboard`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-semibold transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>Hasil Quiz</span>
                      </a>
                      <a
                        href={`/api/admin/export?code=${s.joinCode}&type=attendance`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>Kehadiran</span>
                      </a>
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
