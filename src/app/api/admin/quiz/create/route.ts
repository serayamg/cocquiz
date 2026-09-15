import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateRoomCode(): string {
  // Generate 6-digit numeric room code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      questionBankId,
      questionCount = 10,
      selectionMode = 'RANDOM', // 'SEQUENTIAL', 'RANDOM', 'MANUAL'
      manualQuestionIds = [],
      topics = [],
      difficulties = [],
      questionTimeLimit = 20,
      gameMode = 'CLASSIC', // 'CLASSIC', 'SPEED_CHALLENGE', 'LEARNING_MODE', 'TEAM_BATTLE'
      allowNickname = false,
      allowAnswerChange = false,
      randomQuestions = true,
      randomAnswers = false,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Quiz title is required' }, { status: 400 });
    }

    // Determine questions to attach
    let chosenQuestions: { id: string }[] = [];

    if (selectionMode === 'MANUAL' && manualQuestionIds.length > 0) {
      chosenQuestions = await prisma.question.findMany({
        where: {
          id: { in: manualQuestionIds },
          active: true,
        },
        select: { id: true },
      });
    } else {
      // Build filter
      const whereClause: any = { active: true };
      if (questionBankId) {
        whereClause.questionBankId = questionBankId;
      }
      if (topics && topics.length > 0) {
        whereClause.topic = { in: topics };
      }
      if (difficulties && difficulties.length > 0) {
        whereClause.difficulty = { in: difficulties };
      }

      let availableQuestions = await prisma.question.findMany({
        where: whereClause,
        select: { id: true },
        orderBy: { questionNumber: 'asc' },
      });

      if (availableQuestions.length === 0) {
        // Fallback to any active questions if filters yield nothing
        availableQuestions = await prisma.question.findMany({
          where: { active: true },
          select: { id: true },
        });
      }

      if (selectionMode === 'RANDOM' || randomQuestions) {
        // Shuffle
        availableQuestions.sort(() => Math.random() - 0.5);
      }

      const limit = Math.min(questionCount, availableQuestions.length);
      chosenQuestions = availableQuestions.slice(0, limit);
    }

    if (chosenQuestions.length === 0) {
      return NextResponse.json({ error: 'No active questions available to create quiz' }, { status: 400 });
    }

    // Generate unique 6-digit code
    let joinCode = generateRoomCode();
    let collision = await prisma.quizSession.findUnique({ where: { joinCode } });
    while (collision) {
      joinCode = generateRoomCode();
      collision = await prisma.quizSession.findUnique({ where: { joinCode } });
    }

    const session = await prisma.quizSession.create({
      data: {
        title: title.trim(),
        joinCode,
        status: 'WAITING',
        gameMode,
        questionTimeLimit: Number(questionTimeLimit) || 20,
        randomQuestions: Boolean(randomQuestions),
        randomAnswers: Boolean(randomAnswers),
        allowNickname: Boolean(allowNickname),
        allowAnswerChange: Boolean(allowAnswerChange),
        showExplanation: true,
        currentQuestionIndex: 0,
        roundState: 'LOBBY',
        questions: {
          create: chosenQuestions.map((q, idx) => ({
            questionId: q.id,
            orderIndex: idx,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({
      success: true,
      quiz: {
        id: session.id,
        title: session.title,
        joinCode: session.joinCode,
        questionCount: session.questions.length,
        timeLimit: session.questionTimeLimit,
        gameMode: session.gameMode,
      },
    });
  } catch (error: any) {
    console.error('Create quiz error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create quiz' }, { status: 500 });
  }
}
