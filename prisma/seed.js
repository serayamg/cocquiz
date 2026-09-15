const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const QUESTIONS = [
  {
    number: 1,
    topic: "Dasar Etika",
    difficulty: "LOW",
    question: "Manakah pernyataan yang paling tepat menggambarkan hubungan antara kepatuhan dan etika?",
    options: [
      { key: "A", text: "Kepatuhan dan etika memiliki arti yang sama.", correct: false },
      { key: "B", text: "Kepatuhan berfokus pada aturan, sedangkan etika membantu menentukan tindakan yang benar.", correct: true },
      { key: "C", text: "Etika hanya berlaku jika tidak ada aturan.", correct: false },
      { key: "D", text: "Kepatuhan lebih penting daripada integritas.", correct: false }
    ],
    explanation: "Kepatuhan berkaitan dengan menjalankan aturan dan ketentuan, sedangkan etika berkaitan dengan melakukan hal yang benar."
  },
  {
    number: 2,
    topic: "Kepercayaan dalam Industri Perbankan",
    difficulty: "LOW",
    question: "Mengapa integritas sangat penting dalam industri perbankan?",
    options: [
      { key: "A", text: "Agar pegawai terlihat lebih profesional.", correct: false },
      { key: "B", text: "Karena bank hanya dapat beroperasi dengan teknologi yang baik.", correct: false },
      { key: "C", text: "Karena kepercayaan merupakan fondasi hubungan antara bank dan nasabah.", correct: true },
      { key: "D", text: "Agar seluruh keputusan dapat dibuat lebih cepat.", correct: false }
    ],
    explanation: "Bank mengelola dana dan informasi nasabah. Kepercayaan merupakan fondasi utama keberlangsungan bank."
  },
  {
    number: 3,
    topic: "Prinsip Integritas",
    difficulty: "LOW",
    question: "Seorang pegawai tetap mengikuti prosedur dan melakukan tindakan yang benar meskipun tidak ada atasan atau auditor yang mengawasi. Perilaku tersebut paling mencerminkan:",
    options: [
      { key: "A", text: "Konformitas", correct: false },
      { key: "B", text: "Integritas", correct: true },
      { key: "C", text: "Konflik kepentingan", correct: false },
      { key: "D", text: "Rasionalisasi", correct: false }
    ],
    explanation: "Integritas terlihat dari konsistensi antara nilai, perkataan, dan tindakan, termasuk ketika tidak diawasi."
  },
  {
    number: 4,
    topic: "Legal Belum Tentu Etis",
    difficulty: "LOW",
    question: "Seorang pegawai menemukan celah dalam prosedur yang memungkinkan suatu tindakan dilakukan tanpa melanggar aturan tertulis. Namun, tindakan tersebut berpotensi merugikan nasabah. Apa tindakan yang paling tepat?",
    options: [
      { key: "A", text: "Melanjutkan karena tidak melanggar aturan tertulis.", correct: false },
      { key: "B", text: "Melanjutkan jika menguntungkan bank.", correct: false },
      { key: "C", text: "Menilai dampak etisnya dan berkonsultasi sebelum bertindak.", correct: true },
      { key: "D", text: "Mengikuti tindakan pegawai lain.", correct: false }
    ],
    explanation: "Legal belum tentu etis. Selain aturan, pegawai perlu mempertimbangkan dampak dan kepentingan pihak yang terdampak."
  },
  {
    number: 5,
    topic: "Good Corporate Governance",
    difficulty: "LOW",
    question: "Manakah berikut ini yang BUKAN termasuk prinsip utama Good Corporate Governance?",
    options: [
      { key: "A", text: "Transparency", correct: false },
      { key: "B", text: "Accountability", correct: false },
      { key: "C", text: "Independency", correct: false },
      { key: "D", text: "Popularity", correct: true }
    ],
    explanation: "Prinsip GCG mencakup Transparency, Accountability, Responsibility, Independency, dan Fairness."
  },
  {
    number: 6,
    topic: "Three Lines Model",
    difficulty: "MEDIUM_LOW",
    question: "Dalam Three Lines Model, unit bisnis dan operasional terutama memiliki peran:",
    options: [
      { key: "A", text: "Memberikan audit independen.", correct: false },
      { key: "B", text: "Memiliki dan mengelola risiko serta menjalankan pengendalian sehari-hari.", correct: true },
      { key: "C", text: "Menetapkan seluruh kebijakan regulator.", correct: false },
      { key: "D", text: "Menggantikan fungsi kepatuhan.", correct: false }
    ],
    explanation: "Lini pertama menjalankan aktivitas sekaligus menjadi benteng pertama dalam pengelolaan risiko dan pengendalian."
  },
  {
    number: 7,
    topic: "Benturan Kepentingan",
    difficulty: "MEDIUM_LOW",
    question: "Seorang pegawai terlibat dalam proses evaluasi perusahaan yang dimiliki anggota keluarganya sebagai calon vendor bank. Apa tindakan yang paling tepat?",
    options: [
      { key: "A", text: "Tetap terlibat karena yakin objektif.", correct: false },
      { key: "B", text: "Tidak perlu melapor jika tidak menerima keuntungan.", correct: false },
      { key: "C", text: "Mengungkapkan potensi benturan kepentingan dan mengikuti mekanisme yang berlaku.", correct: true },
      { key: "D", text: "Menyembunyikan hubungan tersebut.", correct: false }
    ],
    explanation: "Potensi konflik kepentingan perlu diungkapkan agar keputusan tetap objektif dan dapat dipertanggungjawabkan."
  },
  {
    number: 8,
    topic: "Gratifikasi",
    difficulty: "MEDIUM_LOW",
    question: "Seorang vendor memberikan hadiah bernilai cukup besar kepada pegawai yang sedang terlibat dalam proses pemilihan vendor. Tindakan paling tepat adalah:",
    options: [
      { key: "A", text: "Menerima karena diberikan sukarela.", correct: false },
      { key: "B", text: "Menerima tetapi tidak memberitahukan siapa pun.", correct: false },
      { key: "C", text: "Menilai berdasarkan ketentuan, serta menolak atau melaporkan sesuai prosedur.", correct: true },
      { key: "D", text: "Memberikan hadiah kepada rekan kerja.", correct: false }
    ],
    explanation: "Hadiah dapat menimbulkan konflik kepentingan atau memengaruhi objektivitas. Prinsipnya: kenali, nilai, tolak bila perlu, dan laporkan."
  },
  {
    number: 9,
    topic: "Kerahasiaan Data Nasabah",
    difficulty: "MEDIUM_LOW",
    question: "Seorang pegawai ingin menyelesaikan pekerjaan di rumah lalu mengirim data nasabah ke email pribadinya. Tindakan tersebut:",
    options: [
      { key: "A", text: "Diperbolehkan jika setelah jam kantor.", correct: false },
      { key: "B", text: "Diperbolehkan jika tidak dibagikan kepada orang lain.", correct: false },
      { key: "C", text: "Berisiko melanggar prinsip perlindungan dan kerahasiaan data.", correct: true },
      { key: "D", text: "Selalu diperbolehkan dengan perangkat pribadi.", correct: false }
    ],
    explanation: "Data nasabah merupakan amanah dan harus digunakan serta dikirim sesuai prosedur dan ketentuan keamanan informasi."
  },
  {
    number: 10,
    topic: "Fraud Triangle",
    difficulty: "MEDIUM_LOW",
    question: "Seorang pegawai mengalami masalah keuangan, memiliki akses terhadap sistem dengan pengawasan lemah, dan berpikir bahwa ia hanya 'meminjam sementara' uang perusahaan. Situasi tersebut menggambarkan:",
    options: [
      { key: "A", text: "Fraud Triangle", correct: true },
      { key: "B", text: "Three Lines Model", correct: false },
      { key: "C", text: "PLUS Filter", correct: false },
      { key: "D", text: "Ethical Leadership", correct: false }
    ],
    explanation: "Fraud Triangle terdiri dari Pressure, Opportunity, dan Rationalization."
  },
  {
    number: 11,
    topic: "Ethical Fading",
    difficulty: "MEDIUM",
    question: "Seorang pegawai mengatakan: 'Ini hanya sedikit penyesuaian angka agar target terlihat tercapai.' Padahal informasi menjadi tidak akurat. Situasi tersebut merupakan contoh:",
    options: [
      { key: "A", text: "Ethical fading", correct: true },
      { key: "B", text: "Transparency", correct: false },
      { key: "C", text: "Accountability", correct: false },
      { key: "D", text: "Fairness", correct: false }
    ],
    explanation: "Ethical fading terjadi ketika aspek moral tindakan disamarkan, misalnya manipulasi disebut sebagai 'penyesuaian angka'."
  },
  {
    number: 12,
    topic: "Slippery Slope",
    difficulty: "MEDIUM",
    question: "Seorang pegawai awalnya melanggar prosedur kecil, lalu tindakan tersebut menjadi kebiasaan dan berkembang menjadi pelanggaran lebih serius. Fenomena tersebut disebut:",
    options: [
      { key: "A", text: "Psychological safety", correct: false },
      { key: "B", text: "Slippery slope", correct: true },
      { key: "C", text: "Transparency", correct: false },
      { key: "D", text: "Independency", correct: false }
    ],
    explanation: "Slippery slope menggambarkan kompromi kecil yang dinormalisasi dan berkembang menjadi pelanggaran lebih besar."
  },
  {
    number: 13,
    topic: "Pengambilan Keputusan Etis",
    difficulty: "MEDIUM",
    question: "Pegawai memeriksa apakah tindakan sesuai kebijakan, legal, sesuai nilai universal, dan sesuai hati nurani. Kerangka tersebut adalah:",
    options: [
      { key: "A", text: "Fraud Pentagon", correct: false },
      { key: "B", text: "Three Lines Model", correct: false },
      { key: "C", text: "PLUS Filter", correct: true },
      { key: "D", text: "Fraud Triangle", correct: false }
    ],
    explanation: "PLUS Filter terdiri dari Policy, Legal, Universal, dan Self."
  },
  {
    number: 14,
    topic: "Speak-Up",
    difficulty: "MEDIUM",
    question: "Pegawai menemukan indikasi rekannya berpotensi melanggar ketentuan tetapi takut dianggap tidak loyal. Tindakan paling sesuai adalah:",
    options: [
      { key: "A", text: "Diam agar hubungan baik.", correct: false },
      { key: "B", text: "Menyebarkan informasi ke seluruh pegawai.", correct: false },
      { key: "C", text: "Menggunakan saluran pelaporan atau mekanisme speak-up yang tersedia.", correct: true },
      { key: "D", text: "Membagikan informasi di media sosial.", correct: false }
    ],
    explanation: "Speak-up dan whistleblowing dilakukan melalui saluran yang tepat untuk membantu melindungi organisasi dari risiko."
  },
  {
    number: 15,
    topic: "Implementasi Integritas",
    difficulty: "MEDIUM",
    question: "Atasan meminta bawahan mempercepat proses dengan melewati tahapan pengendalian. Bawahan menilai tindakan itu berisiko dan tidak sesuai prosedur. Respons terbaik adalah:",
    options: [
      { key: "A", text: "Langsung mengikuti instruksi atasan.", correct: false },
      { key: "B", text: "Menolak secara emosional.", correct: false },
      { key: "C", text: "Meminta klarifikasi, merujuk ketentuan, menjelaskan risiko, menawarkan alternatif, dan melakukan eskalasi bila diperlukan.", correct: true },
      { key: "D", text: "Mengikuti instruksi tanpa dokumentasi.", correct: false }
    ],
    explanation: "Keberanian moral dilakukan secara profesional: klarifikasi, rujuk aturan, jelaskan risiko, tawarkan alternatif, eskalasi bila perlu, dan dokumentasikan sesuai ketentuan."
  }
];

async function main() {
  console.log('Seeding QUIZ ARENA database...');

  // 1. Create Default Users
  await prisma.user.upsert({
    where: { email: 'admin@quizarena.com' },
    update: {},
    create: {
      name: 'Super Administrator',
      email: 'admin@quizarena.com',
      password: 'Admin@123456', // in production hash with bcrypt
      role: 'SUPER_ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { email: 'trainer@quizarena.com' },
    update: {},
    create: {
      name: 'Trainer Host',
      email: 'trainer@quizarena.com',
      password: 'Trainer@123456',
      role: 'TRAINER'
    }
  });

  // 2. Create Question Bank
  let bank = await prisma.questionBank.findFirst({
    where: { title: 'Code of Conduct & Business Ethics' }
  });

  if (!bank) {
    bank = await prisma.questionBank.create({
      data: {
        title: 'Code of Conduct & Business Ethics',
        description: 'Bank Soal Pemahaman & Implementasi Code of Conduct & Business Ethics (15 Soal Pilihan Ganda)',
        category: 'Governance & Ethics'
      }
    });
  }

  // 3. Seed Questions & Options
  const createdQuestionIds = [];
  for (const q of QUESTIONS) {
    let existing = await prisma.question.findFirst({
      where: {
        questionBankId: bank.id,
        questionNumber: q.number
      }
    });

    if (!existing) {
      existing = await prisma.question.create({
        data: {
          questionBankId: bank.id,
          questionNumber: q.number,
          topic: q.topic,
          difficulty: q.difficulty,
          questionText: q.question,
          explanation: q.explanation,
          active: true,
          options: {
            create: q.options.map(opt => ({
              optionKey: opt.key,
              optionText: opt.text,
              isCorrect: opt.correct
            }))
          }
        }
      });
    }
    createdQuestionIds.push(existing.id);
  }

  // 4. Create Demo Quiz Session
  const joinCode = '784921';
  let session = await prisma.quizSession.findUnique({
    where: { joinCode }
  });

  if (!session) {
    session = await prisma.quizSession.create({
      data: {
        title: 'CODE OF CONDUCT CHALLENGE',
        joinCode: joinCode,
        status: 'WAITING',
        gameMode: 'CLASSIC',
        questionTimeLimit: 20,
        randomQuestions: false,
        randomAnswers: false,
        allowNickname: false,
        allowAnswerChange: false,
        showExplanation: true,
        currentQuestionIndex: 0,
        roundState: 'LOBBY',
        questions: {
          create: createdQuestionIds.map((qId, idx) => ({
            questionId: qId,
            orderIndex: idx
          }))
        }
      }
    });
    console.log(`Created Demo Session with Code: ${joinCode}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
