import { NextRequest, NextResponse } from 'next/server';
import { quizHub } from '@/lib/quiz-hub';

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const joinCode = params.code;
    const body = await req.json();
    const { action, participantId } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const state = await quizHub.handleHostAction(joinCode, action, { participantId });
    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    console.error('Error in host action:', error);
    return NextResponse.json({ error: error.message || 'Host action failed' }, { status: 400 });
  }
}
