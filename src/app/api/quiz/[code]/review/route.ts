import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const joinCode = params.code;
    const sessionToken = req.nextUrl.searchParams.get('token');

    const session = await prisma.quizSession.findUnique({
      where: { joinCode },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    let participantAnswers: Record<string, { selectedKey: string; isCorrect: boolean }> = {};

    if (sessionToken) {
      const participant = await prisma.participant.findUnique({
        where: { sessionToken },
        include: {
          answers: true,
        },
      });

      if (participant) {
        participant.answers.forEach((ans) => {
          participantAnswers[ans.quizQuestionId] = {
            selectedKey: ans.selectedOptionKey,
            isCorrect: ans.isCorrect,
          };
        });
      }
    }

    const reviewData = session.questions.map((q, idx) => {
      const pAns = participantAnswers[q.id];
      const correctOpt = q.question.options.find((o) => o.isCorrect);

      return {
        number: idx + 1,
        topic: q.question.topic,
        difficulty: q.question.difficulty,
        questionText: q.question.questionText,
        options: q.question.options.map((o) => ({
          key: o.optionKey,
          text: o.optionText,
          isCorrect: o.isCorrect,
        })),
        correctKey: correctOpt?.optionKey || '',
        correctText: correctOpt?.optionText || '',
        explanation: q.question.explanation,
        userAnswerKey: pAns ? pAns.selectedKey : null,
        isUserCorrect: pAns ? pAns.isCorrect : false,
      };
    });

    return NextResponse.json({
      title: session.title,
      questions: reviewData,
    });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch review' }, { status: 500 });
  }
}
