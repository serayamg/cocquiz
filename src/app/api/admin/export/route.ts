import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sortLeaderboard } from '@/lib/scoring';

export async function GET(req: NextRequest) {
  try {
    const sessionCode = req.nextUrl.searchParams.get('code');
    const exportType = req.nextUrl.searchParams.get('type') || 'leaderboard'; // 'leaderboard' | 'attendance' | 'questions'

    const session = sessionCode
      ? await prisma.quizSession.findUnique({
          where: { joinCode: sessionCode },
          include: {
            participants: {
              include: { answers: true },
            },
            questions: {
              include: {
                question: true,
                answers: true,
              },
            },
          },
        })
      : null;

    let csvContent = '';
    let filename = `export_${exportType}_${Date.now()}.csv`;

    if (exportType === 'attendance') {
      const participants = await prisma.participant.findMany({
        where: session ? { quizSessionId: session.id } : {},
        include: { quizSession: true },
        orderBy: { joinedAt: 'asc' },
      });

      csvContent = 'Session Code,Session Title,Participant Name,Unit / Company,Email,Joined At,Total Score,Correct Answers,Wrong Answers\n';
      participants.forEach((p) => {
        csvContent += `"${p.quizSession.joinCode}","${p.quizSession.title}","${p.name}","${p.unitOrCompany || '-'}","${p.email || '-'}","${p.joinedAt.toISOString()}",${p.totalScore},${p.correctCount},${p.wrongCount}\n`;
      });
      filename = `Attendance_${sessionCode || 'All'}_${Date.now()}.csv`;
    } else if (exportType === 'questions') {
      const questions = await prisma.question.findMany({
        include: { options: true },
      });

      csvContent = 'No,Topic,Difficulty,Question Text,Option A,Option B,Option C,Option D,Correct Answer,Explanation\n';
      questions.forEach((q, idx) => {
        const optA = q.options.find((o) => o.optionKey === 'A')?.optionText.replace(/"/g, '""') || '';
        const optB = q.options.find((o) => o.optionKey === 'B')?.optionText.replace(/"/g, '""') || '';
        const optC = q.options.find((o) => o.optionKey === 'C')?.optionText.replace(/"/g, '""') || '';
        const optD = q.options.find((o) => o.optionKey === 'D')?.optionText.replace(/"/g, '""') || '';
        const correct = q.options.find((o) => o.isCorrect)?.optionKey || '';
        csvContent += `${idx + 1},"${q.topic}","${q.difficulty}","${q.questionText.replace(/"/g, '""')}","${optA}","${optB}","${optC}","${optD}","${correct}","${q.explanation.replace(/"/g, '""')}"\n`;
      });
      filename = `Question_Bank_${Date.now()}.csv`;
    } else {
      // Default: Leaderboard / Quiz Results
      const participants = session ? session.participants : await prisma.participant.findMany();
      const sorted = sortLeaderboard(participants);

      csvContent = 'Rank,Participant Name,Unit / Company,Correct,Wrong,Accuracy,Avg Response Time (s),Total Score\n';
      sorted.forEach((p, idx) => {
        const totalAnswers = p.correctCount + p.wrongCount;
        const accuracy = totalAnswers > 0 ? Math.round((p.correctCount / totalAnswers) * 100) : 0;
        const avgTime = totalAnswers > 0 ? (p.totalResponseTimeMs / totalAnswers / 1000).toFixed(1) : '0.0';
        csvContent += `${idx + 1},"${p.name}","${p.unitOrCompany || '-'}","${p.correctCount}","${p.wrongCount}","${accuracy}%","${avgTime}s",${p.totalScore}\n`;
      });
      filename = `Leaderboard_${sessionCode || 'All'}_${Date.now()}.csv`;
    }

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
