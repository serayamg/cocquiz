'use client';

import React, { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { 
  Database, Search, Filter, Plus, Edit2, Trash2, 
  UploadCloud, Download, Check, X, CheckCircle2, AlertCircle, 
  Layers, ChevronDown, BookOpen 
} from 'lucide-react';

interface Option {
  id?: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

interface QuestionItem {
  id: string;
  questionNumber: number | null;
  topic: string;
  difficulty: string;
  questionText: string;
  explanation: string;
  active: boolean;
  options: Option[];
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTopic, setFormTopic] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('LOW');
  const [formQuestionText, setFormQuestionText] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formOptions, setFormOptions] = useState([
    { key: 'A', text: '', correct: false },
    { key: 'B', text: '', correct: true },
    { key: 'C', text: '', correct: false },
    { key: 'D', text: '', correct: false },
  ]);

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedDifficulty !== 'ALL') params.set('difficulty', selectedDifficulty);
      if (selectedTopic !== 'ALL') params.set('topic', selectedTopic);
      if (selectedStatus === 'active') params.set('status', 'active');
      if (selectedStatus === 'inactive') params.set('status', 'inactive');

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTopics(data.topics || []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedDifficulty, selectedTopic, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  // Open Create Question Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormTopic('Dasar Etika');
    setFormDifficulty('LOW');
    setFormQuestionText('');
    setFormExplanation('');
    setFormActive(true);
    setFormOptions([
      { key: 'A', text: '', correct: false },
      { key: 'B', text: '', correct: true },
      { key: 'C', text: '', correct: false },
      { key: 'D', text: '', correct: false },
    ]);
    setIsEditorOpen(true);
  };

  // Open Edit Question Modal
  const handleOpenEdit = (q: QuestionItem) => {
    setEditingId(q.id);
    setFormTopic(q.topic);
    setFormDifficulty(q.difficulty);
    setFormQuestionText(q.questionText);
    setFormExplanation(q.explanation);
    setFormActive(q.active);

    const mappedOpts = ['A', 'B', 'C', 'D'].map((k) => {
      const found = q.options.find((o) => o.optionKey === k);
      return {
        key: k,
        text: found ? found.optionText : '',
        correct: found ? found.isCorrect : false,
      };
    });
    setFormOptions(mappedOpts);
    setIsEditorOpen(true);
  };

  // Save Question (Create or Update)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id: editingId || undefined,
        topic: formTopic,
        difficulty: formDifficulty,
        questionText: formQuestionText,
        explanation: formExplanation,
        active: formActive,
        options: formOptions,
      };

      const res = await fetch('/api/admin/questions', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditorOpen(false);
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error saving question:', err);
    }
  };

  // Delete Question
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  // Handle JSON / CSV Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus('Memproses import...');
    try {
      let parsedData: any[] = [];
      if (importText.trim().startsWith('[') || importText.trim().startsWith('{')) {
        parsedData = JSON.parse(importText);
        if (!Array.isArray(parsedData)) parsedData = [parsedData];
      } else {
        // Simple CSV parse
        const lines = importText.trim().split('\n');
        const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        parsedData = lines.slice(1).map((line) => {
          const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          return {
            topic: vals[1] || 'General',
            difficulty: vals[2] || 'LOW',
            questionText: vals[3] || vals[0],
            option_a: vals[4],
            option_b: vals[5],
            option_c: vals[6],
            option_d: vals[7],
            correct_answer: vals[8] || 'A',
            explanation: vals[9] || 'Penjelasan jawaban.',
          };
        });
      }

      const res = await fetch('/api/admin/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: parsedData }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportStatus(`Berhasil mengimpor ${data.importedCount} soal!`);
        setTimeout(() => {
          setIsImportOpen(false);
          setImportStatus(null);
          setImportText('');
          fetchQuestions();
        }, 1500);
      } else {
        setImportStatus(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setImportStatus(`Format salah: ${err.message}`);
    }
  };

  // Metrics count
  const activeCount = questions.filter((q) => q.active).length;
  const lowCount = questions.filter((q) => q.difficulty === 'LOW').length;
  const medLowCount = questions.filter((q) => q.difficulty === 'MEDIUM_LOW').length;
  const medCount = questions.filter((q) => q.difficulty === 'MEDIUM').length;

  return (
    <div className="min-h-screen bg-[#0A0F24] text-white flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Database className="w-7 h-7 text-blue-400" />
              <span>Bank Soal (Question Bank)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Kelola database soal Code of Conduct &amp; Business Ethics, tambah, edit, atau import bank soal
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsImportOpen(true)}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Import Soal</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Soal</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Pills (Section 21) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="arena-card p-3.5 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">Total Soal</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{questions.length}</div>
          </div>
          <div className="arena-card p-3.5 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">Aktif</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{activeCount}</div>
          </div>
          <div className="arena-card p-3.5 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">Tingkat Low</div>
            <div className="text-xl font-bold font-mono text-blue-300 mt-0.5">{lowCount}</div>
          </div>
          <div className="arena-card p-3.5 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">Medium &amp; Case-Based</div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">{medLowCount + medCount}</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="arena-card p-4 border border-slate-800 mb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pertanyaan, topik, atau kata kunci penjelasan..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              Cari
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filter:</span>
            </div>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Difficulty</option>
              <option value="LOW">Low (Rendah)</option>
              <option value="MEDIUM_LOW">Medium-Low</option>
              <option value="MEDIUM">Medium / Case-Based</option>
            </select>

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Topik</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="active">Aktif Saja</option>
              <option value="inactive">Non-Aktif Saja</option>
            </select>
          </div>
        </div>

        {/* Questions Table */}
        <div className="arena-card border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-40">Topik</th>
                  <th className="py-3 px-4 w-28">Kesulitan</th>
                  <th className="py-3 px-4">Pertanyaan &amp; Kunci</th>
                  <th className="py-3 px-4 w-20 text-center">Status</th>
                  <th className="py-3 px-4 w-24 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {questions.map((q, idx) => {
                  const correctOpt = q.options.find((o) => o.isCorrect);

                  return (
                    <tr key={q.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                        {q.questionNumber || idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-cyan-300">
                        {q.topic}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            q.difficulty === 'LOW'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : q.difficulty === 'MEDIUM_LOW'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white mb-1.5 leading-snug">
                          {q.questionText}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-300">
                          <span className="w-5 h-5 rounded bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                            {correctOpt?.optionKey || 'A'}
                          </span>
                          <span className="text-emerald-300/90 truncate max-w-md">
                            {correctOpt?.optionText}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.active
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-slate-700/50 text-slate-400'
                          }`}
                        >
                          {q.active ? 'Aktif' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Edit Soal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* QUESTION EDITOR MODAL (Section 22) */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="arena-card p-6 max-w-2xl w-full border border-blue-500/40 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Topik / Kategori</label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Contoh: Benturan Kepentingan"
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Kesulitan</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">LOW (Rendah)</option>
                    <option value="MEDIUM_LOW">MEDIUM-LOW (Rendah-Menengah)</option>
                    <option value="MEDIUM">MEDIUM (Menengah Case-Based)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status Soal</label>
                  <select
                    value={formActive ? 'active' : 'draft'}
                    onChange={(e) => setFormActive(e.target.value === 'active')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft / Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teks Pertanyaan</label>
                <textarea
                  rows={3}
                  value={formQuestionText}
                  onChange={(e) => setFormQuestionText(e.target.value)}
                  placeholder="Tuliskan butir pertanyaan di sini..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pilihan Jawaban (Pilih radio untuk Kunci Benar)
                </label>
                <div className="space-y-2">
                  {formOptions.map((opt, idx) => (
                    <div key={opt.key} className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={opt.correct}
                          onChange={() => {
                            setFormOptions(
                              formOptions.map((o) => ({
                                ...o,
                                correct: o.key === opt.key,
                              }))
                            );
                          }}
                          className="w-4 h-4 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="w-6 h-6 rounded bg-slate-800 text-white font-bold text-xs flex items-center justify-center font-mono">
                          {opt.key}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...formOptions];
                          newOpts[idx].text = e.target.value;
                          setFormOptions(newOpts);
                        }}
                        placeholder={`Teks pilihan ${opt.key}...`}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Penjelasan Jawaban (Why This Is Correct - Edukasi)
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Jelaskan alasan mengapa jawaban ini benar untuk insight edukatif..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md"
                >
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL (Section 23) */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="arena-card p-6 max-w-xl w-full border border-cyan-500/40">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-cyan-400" />
                <span>Import Bank Soal (CSV / JSON)</span>
              </h3>
              <button
                onClick={() => setIsImportOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-300 font-semibold">
                  Tempel data CSV atau format JSON:
                </span>
                <a
                  href="/api/admin/export?type=questions"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template CSV</span>
                </a>
              </div>
              <textarea
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='Paste data JSON atau CSV di sini...'
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {importStatus && (
              <div className="mb-4 p-2.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-medium">
                {importStatus}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
              >
                Proses Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
