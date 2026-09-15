import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { quizHub } from '@/lib/quiz-hub';
import crypto from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const joinCode = params.code;
    const body = await req.json();
    const { name, unitOrCompany, email, existingToken } = body;

    const session = await prisma.quizSession.findUnique({
      where: { joinCode },
    });

    if (!session) {
      return NextResponse.json({ error: 'This quiz room does not exist.' }, { status: 404 });
    }

    if (session.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'This quiz session is archived.' }, { status: 400 });
    }

    // Check reconnection with existingToken
    if (existingToken) {
      const existingParticipant = await prisma.participant.findFirst({
        where: {
          quizSessionId: session.id,
          sessionToken: existingToken,
          isKicked: false,
        },
      });

      if (existingParticipant) {
        // Broadcast participant reconnected
        await quizHub.broadcastState(joinCode);
        const state = await quizHub.getRoomState(joinCode, false);
        return NextResponse.json({
          success: true,
          participant: {
            id: existingParticipant.id,
            name: existingParticipant.name,
            unitOrCompany: existingParticipant.unitOrCompany,
            sessionToken: existingParticipant.sessionToken,
            totalScore: existingParticipant.totalScore,
            correctCount: existingParticipant.correctCount,
          },
          state,
        });
      }
    }

    // New Participant Registration
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }

    const sessionToken = crypto.randomBytes(24).toString('hex');

    const newParticipant = await prisma.participant.create({
      data: {
        quizSessionId: session.id,
        name: name.trim(),
        unitOrCompany: unitOrCompany ? unitOrCompany.trim() : null,
        email: email ? email.trim() : null,
        sessionToken,
      },
    });

    // Notify room of new participant
    await quizHub.broadcastState(joinCode);
    const state = await quizHub.getRoomState(joinCode, false);

    return NextResponse.json({
      success: true,
      participant: {
        id: newParticipant.id,
        name: newParticipant.name,
        unitOrCompany: newParticipant.unitOrCompany,
        sessionToken: newParticipant.sessionToken,
        totalScore: 0,
        correctCount: 0,
      },
      state,
    });
  } catch (error: any) {
    console.error('Error joining quiz:', error);
    return NextResponse.json({ error: error.message || 'Failed to join quiz.' }, { status: 500 });
  }
}
