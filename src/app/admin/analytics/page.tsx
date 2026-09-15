'use client';

import React, { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { 
  BarChart3, TrendingUp, Users, Clock, Award, 
  Lightbulb, AlertCircle, CheckCircle2, ChevronRight 
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F24] text-white flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-cyan-400" />
            <span>Learning Analytics &amp; Training Insights</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analisis pemahaman peserta per topik etika bisnis, evaluasi butir soal, dan rekomendasi penguatan materi
          </p>
        </div>

        {/* Metric Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="arena-card p-5 border border-blue-500/20">
            <span className="text-xs font-semibold text-slate-400">Total Partisipan</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {data?.summary?.totalParticipants || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Peserta training aktif</div>
          </div>

          <div className="arena-card p-5 border border-emerald-500/20">
            <span className="text-xs font-semibold text-slate-400">Rata-rata Akurasi</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {data?.summary?.avgAccuracy || 0}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tingkat ketepatan jawaban</div>
          </div>

          <div className="arena-card p-5 border border-purple-500/20">
            <span className="text-xs font-semibold text-slate-400">Rata-rata Skor</span>
            <div className="text-2xl font-black text-purple-300 font-mono mt-1">
              {data?.summary?.avgScore?.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Poin termasuk speed bonus</div>
          </div>

          <div className="arena-card p-5 border border-amber-500/20">
            <span className="text-xs font-semibold text-slate-400">Rata-rata Waktu Jawab</span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {data?.summary?.avgResponseTimeSec || 0}s
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Kecepatan respons peserta</div>
          </div>
        </div>

        {/* Section 41: Automatic Training Insights Card */}
        <div className="arena-card p-6 border border-cyan-500/30 bg-gradient-to-r from-blue-950/30 via-slate-900/60 to-purple-950/30 mb-8">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 uppercase tracking-wider mb-3">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span>Automatic Training Insights (Rekomendasi Trainer)</span>
          </div>

          <div className="space-y-2.5">
            {data?.automatedInsights && data.automatedInsights.length > 0 ? (
              data.automatedInsights.map((insight: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/60 text-xs sm:text-sm text-slate-200 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{insight}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic">
                Belum ada data respons peserta untuk menghasilkan analisis training.
              </div>
            )}
          </div>
        </div>

        {/* Section 40: Topic Analysis Breakdown */}
        <div className="arena-card p-6 border border-slate-800 mb-8">
          <h3 className="text-base font-bold text-white mb-1">
            Topic Performance Breakdown (Pemahaman per Topik)
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Menunjukkan materi yang telah dikuasai vs materi yang memerlukan penguatan tambahan
          </p>

          <div className="space-y-4">
            {data?.topicAnalysis && data.topicAnalysis.length > 0 ? (
              data.topicAnalysis.map((item: any) => {
                let barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
                let textColor = 'text-emerald-400';
                if (item.accuracy < 50) {
                  barColor = 'bg-gradient-to-r from-rose-500 to-red-600';
                  textColor = 'text-rose-400';
                } else if (item.accuracy < 70) {
                  barColor = 'bg-gradient-to-r from-amber-500 to-orange-500';
                  textColor = 'text-amber-400';
                }

                return (
                  <div key={item.topic} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-200">{item.topic}</span>
                      <span className={`font-mono ${textColor}`}>
                        {item.accuracy}% ({item.totalAttempts} jawaban)
                      </span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 italic py-4 text-center">
                Belum ada data topik yang tersimpan.
              </div>
            )}
          </div>
        </div>

        {/* Section 39: Question-by-Question Analysis */}
        <div className="arena-card p-6 border border-slate-800 overflow-hidden">
          <h3 className="text-base font-bold text-white mb-1">
            Question-by-Question Analysis (Analisis Butir Soal)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Tinjau tingkat kesulitan riil, persentase benar/salah, dan interpretasi sistem
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Topik &amp; Pertanyaan</th>
                  <th className="py-3 px-4 w-28 text-center">Kesulitan</th>
                  <th className="py-3 px-4 w-28 text-center">Benar %</th>
                  <th className="py-3 px-4 w-28 text-center">Salah %</th>
                  <th className="py-3 px-4 w-28 text-center">Rata2 Waktu</th>
                  <th className="py-3 px-4 w-60">Interpretasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.questionPerformance && data.questionPerformance.length > 0 ? (
                  data.questionPerformance.map((q: any) => (
                    <tr key={q.questionId} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-cyan-300 text-[11px] uppercase mb-0.5">{q.topic}</div>
                        <div className="font-medium text-white max-w-md line-clamp-2">{q.questionText}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                        {q.correctPct}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                        {q.wrongPct}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {q.avgTimeSec}s
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                        {q.interpretation}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      Belum ada respons jawaban peserta yang tercatat untuk dianalisis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
