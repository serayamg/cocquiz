import { NextRequest, NextResponse } from 'next/server';
import { quizHub } from '@/lib/quiz-hub';

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const joinCode = params.code;
    const body = await req.json();
    const { sessionToken, quizQuestionId, selectedOptionKey } = body;

    if (!sessionToken || !quizQuestionId || !selectedOptionKey) {
      return NextResponse.json(
        { error: 'Missing sessionToken, quizQuestionId, or selectedOptionKey' },
        { status: 400 }
      );
    }

    const result = await quizHub.submitAnswer({
      joinCode,
      sessionToken,
      quizQuestionId,
      selectedOptionKey,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit answer' }, { status: 400 });
  }
}
