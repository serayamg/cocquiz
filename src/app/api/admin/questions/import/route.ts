import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questions, bankTitle = 'Imported Question Bank' } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided for import' }, { status: 400 });
    }

    // Get or create question bank
    let bank = await prisma.questionBank.findFirst({
      where: { title: bankTitle },
    });

    if (!bank) {
      bank = await prisma.questionBank.create({
        data: {
          title: bankTitle,
          description: `Imported on ${new Date().toLocaleDateString()}`,
          category: 'Corporate Learning',
        },
      });
    }

    let importedCount = 0;
    for (const q of questions) {
      if (!q.questionText || !q.topic || !q.explanation) continue;

      const opts = [
        { key: 'A', text: q.option_a || q.optionA || (q.options && q.options[0]?.text) || 'Option A' },
        { key: 'B', text: q.option_b || q.optionB || (q.options && q.options[1]?.text) || 'Option B' },
        { key: 'C', text: q.option_c || q.optionC || (q.options && q.options[2]?.text) || 'Option C' },
        { key: 'D', text: q.option_d || q.optionD || (q.options && q.options[3]?.text) || 'Option D' },
      ];

      const correctKey = (q.correct_answer || q.correctAnswer || 'A').toUpperCase().trim();

      await prisma.question.create({
        data: {
          questionBankId: bank.id,
          topic: q.topic,
          difficulty: q.difficulty || 'LOW',
          questionText: q.questionText || q.question,
          explanation: q.explanation,
          active: true,
          options: {
            create: opts.map((opt) => ({
              optionKey: opt.key,
              optionText: opt.text,
              isCorrect: opt.key === correctKey,
            })),
          },
        },
      });
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      bankId: bank.id,
    });
  } catch (error: any) {
    console.error('Import questions error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import questions' }, { status: 500 });
  }
}
