import { prisma } from './prisma';
import { calculateAnswerScore, sortLeaderboard } from './scoring';

export type RoundState = 'LOBBY' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'PODIUM';

export interface AnswerDistribution {
  A: number;
  B: number;
  C: number;
  D: number;
  total: number;
  medianTimeSec: number;
  fastestTimeSec: number;
  correctCount: number;
}

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  unitOrCompany?: string | null;
  score: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  avgTimeSec: number;
  rank: number;
  prevRank: number;
  rankDelta: number; // e.g. +2, -1, 0
  currentStreak: number;
}

export interface RoomState {
  joinCode: string;
  title: string;
  status: string; // WAITING, LIVE, PAUSED, FINISHED
  roundState: RoundState;
  gameMode: string;
  questionTimeLimit: number;
  allowNickname: boolean;
  allowAnswerChange: boolean;
  showExplanation: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionStartedAtServer: number | null;
  serverNow: number;
  participantsCount: number;
  answersReceivedCount: number;
  // Current question data
  currentQuestion?: {
    id: string;
    orderIndex: number;
    topic: string;
    difficulty: string;
    questionText: string;
    options: {
      key: string;
      text: string;
    }[];
    // ONLY revealed when roundState !== 'QUESTION'
    correctOptionKey?: string;
    explanation?: string;
  } | null;
  distribution?: AnswerDistribution | null;
  leaderboard?: LeaderboardEntry[];
  participants?: {
    id: string;
    name: string;
    unitOrCompany?: string | null;
    isKicked: boolean;
  }[];
}

// Global in-memory broadcast manager
type SSEController = ReadableStreamDefaultController;

class QuizHub {
  private subscribers: Map<string, Set<SSEController>> = new Map();
  private prevRankMap: Map<string, Map<string, number>> = new Map(); // joinCode -> (participantId -> rank)

  public subscribe(joinCode: string, controller: SSEController) {
    if (!this.subscribers.has(joinCode)) {
      this.subscribers.set(joinCode, new Set());
    }
    this.subscribers.get(joinCode)!.add(controller);
  }

  public unsubscribe(joinCode: string, controller: SSEController) {
    const subs = this.subscribers.get(joinCode);
    if (subs) {
      subs.delete(controller);
      if (subs.size === 0) {
        this.subscribers.delete(joinCode);
      }
    }
  }

  public broadcast(joinCode: string, data: unknown) {
    const subs = this.subscribers.get(joinCode);
    if (!subs || subs.size === 0) return;

    const payload = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(payload);

    subs.forEach((controller) => {
      try {
        controller.enqueue(encoded);
      } catch (err) {
        // controller closed or errored
        subs.delete(controller);
      }
    });
  }

  /**
   * Builds the current room state.
   * If isHost === false, correctOptionKey and explanation are stripped if roundState === 'QUESTION'
   */
  public async getRoomState(joinCode: string, isHost: boolean = false): Promise<RoomState | null> {
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
            answers: true,
          },
        },
        participants: {
          where: { isKicked: false },
          include: {
            answers: true,
          },
        },
      },
    });

    if (!session) return null;

    const totalQuestions = session.questions.length;
    const currentQuizQ = session.questions[session.currentQuestionIndex];
    const roundState = session.roundState as RoundState;

    // Build participants list
    const participants = session.participants.map((p) => ({
      id: p.id,
      name: p.name,
      unitOrCompany: p.unitOrCompany,
      isKicked: p.isKicked,
    }));

    // Answers received for current question
    let answersReceivedCount = 0;
    let distribution: AnswerDistribution | null = null;

    if (currentQuizQ) {
      const answers = currentQuizQ.answers;
      answersReceivedCount = answers.length;

      const counts = { A: 0, B: 0, C: 0, D: 0 };
      const responseTimes: number[] = [];
      let correctCount = 0;
      let fastestTimeSec = 999;

      answers.forEach((ans) => {
        const key = ans.selectedOptionKey as keyof typeof counts;
        if (counts[key] !== undefined) counts[key]++;
        if (ans.isCorrect) {
          correctCount++;
          const sec = ans.responseTimeMs / 1000;
          if (sec < fastestTimeSec) fastestTimeSec = sec;
        }
        responseTimes.push(ans.responseTimeMs / 1000);
      });

      responseTimes.sort((a, b) => a - b);
      const medianTimeSec =
        responseTimes.length === 0
          ? 0
          : responseTimes.length % 2 === 1
          ? responseTimes[Math.floor(responseTimes.length / 2)]
          : (responseTimes[responseTimes.length / 2 - 1] + responseTimes[responseTimes.length / 2]) / 2;

      distribution = {
        A: counts.A,
        B: counts.B,
        C: counts.C,
        D: counts.D,
        total: answers.length,
        medianTimeSec: Number(medianTimeSec.toFixed(1)),
        fastestTimeSec: fastestTimeSec === 999 ? 0 : Number(fastestTimeSec.toFixed(1)),
        correctCount,
      };
    }

    // Build current question payload with Anti-Cheat
    let currentQuestionData: RoomState['currentQuestion'] = null;
    if (currentQuizQ) {
      const q = currentQuizQ.question;
      const correctOpt = q.options.find((o) => o.isCorrect);

      const hideAnswer = !isHost && roundState === 'QUESTION';

      currentQuestionData = {
        id: currentQuizQ.id,
        orderIndex: currentQuizQ.orderIndex,
        topic: q.topic,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: q.options.map((o) => ({
          key: o.optionKey,
          text: o.optionText,
        })),
        correctOptionKey: hideAnswer ? undefined : correctOpt?.optionKey,
        explanation: hideAnswer ? undefined : q.explanation,
      };
    }

    // Build Leaderboard
    const sorted = sortLeaderboard(
      session.participants.map((p) => {
        const totalAnswers = p.correctCount + p.wrongCount;
        const accuracy = totalAnswers > 0 ? Math.round((p.correctCount / totalAnswers) * 100) : 0;
        const avgTimeSec = totalAnswers > 0 ? Number((p.totalResponseTimeMs / totalAnswers / 1000).toFixed(1)) : 0;
        return {
          participantId: p.id,
          name: p.name,
          unitOrCompany: p.unitOrCompany,
          score: p.totalScore,
          correctCount: p.correctCount,
          wrongCount: p.wrongCount,
          accuracy,
          avgTimeSec,
          totalScore: p.totalScore,
          totalResponseTimeMs: p.totalResponseTimeMs,
          currentStreak: p.currentStreak,
        };
      })
    );

    // Track rank changes
    let prevRanks = this.prevRankMap.get(joinCode);
    if (!prevRanks) {
      prevRanks = new Map();
      this.prevRankMap.set(joinCode, prevRanks);
    }

    const leaderboard: LeaderboardEntry[] = sorted.map((p, index) => {
      const currentRank = index + 1;
      const prevRank = prevRanks!.get(p.participantId) ?? currentRank;
      const rankDelta = prevRank - currentRank; // positive = moved up e.g. 3 -> 1 is +2

      return {
        participantId: p.participantId,
        name: p.name,
        unitOrCompany: p.unitOrCompany,
        score: p.score,
        correctCount: p.correctCount,
        wrongCount: p.wrongCount,
        accuracy: p.accuracy,
        avgTimeSec: p.avgTimeSec,
        rank: currentRank,
        prevRank,
        rankDelta,
        currentStreak: p.currentStreak,
      };
    });

    // If we're transitioning out of leaderboard, update prevRankMap
    if (roundState === 'LEADERBOARD' || roundState === 'PODIUM') {
      leaderboard.forEach((entry) => {
        prevRanks!.set(entry.participantId, entry.rank);
      });
    }

    return {
      joinCode: session.joinCode,
      title: session.title,
      status: session.status,
      roundState,
      gameMode: session.gameMode,
      questionTimeLimit: session.questionTimeLimit,
      allowNickname: session.allowNickname,
      allowAnswerChange: session.allowAnswerChange,
      showExplanation: session.showExplanation,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions,
      questionStartedAtServer: session.questionStartedAt ? session.questionStartedAt.getTime() : null,
      serverNow: Date.now(),
      participantsCount: participants.length,
      answersReceivedCount,
      currentQuestion: currentQuestionData,
      distribution,
      leaderboard,
      participants,
    };
  }

  /**
   * Broadcasts updated room state to all subscribers
   */
  public async broadcastState(joinCode: string) {
    const state = await this.getRoomState(joinCode, false);
    if (state) {
      this.broadcast(joinCode, { type: 'STATE_UPDATE', state });
    }
  }

  /**
   * Submit participant answer with server-side validation & scoring
   */
  public async submitAnswer(params: {
    joinCode: string;
    sessionToken: string;
    quizQuestionId: string;
    selectedOptionKey: string;
  }) {
    const { joinCode, sessionToken, quizQuestionId, selectedOptionKey } = params;

    const session = await prisma.quizSession.findUnique({
      where: { joinCode },
    });

    if (!session || session.roundState !== 'QUESTION') {
      throw new Error('Quiz is not accepting answers for this question right now.');
    }

    const participant = await prisma.participant.findUnique({
      where: { sessionToken },
    });

    if (!participant || participant.isKicked) {
      throw new Error('Participant invalid or kicked.');
    }

    // Check if already answered
    const existingAnswer = await prisma.participantAnswer.findUnique({
      where: {
        participantId_quizQuestionId: {
          participantId: participant.id,
          quizQuestionId,
        },
      },
    });

    if (existingAnswer && !session.allowAnswerChange) {
      throw new Error('Jawaban sudah terkunci (Answer already locked).');
    }

    // Server-measured response time
    const now = Date.now();
    const startedAt = session.questionStartedAt ? session.questionStartedAt.getTime() : now;
    const responseTimeMs = Math.max(0, now - startedAt);

    // Fetch question to check correctness
    const quizQuestion = await prisma.quizQuestion.findUnique({
      where: { id: quizQuestionId },
      include: {
        question: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quizQuestion) throw new Error('Question not found');

    const correctOption = quizQuestion.question.options.find((o) => o.isCorrect);
    const isCorrect = correctOption ? correctOption.optionKey === selectedOptionKey : false;

    // Calculate score
    const scoreResult = calculateAnswerScore({
      isCorrect,
      responseTimeMs,
      timeLimitSeconds: session.questionTimeLimit,
      currentStreak: participant.currentStreak,
      gameMode: session.gameMode,
    });

    // Save or update participant answer
    if (existingAnswer) {
      await prisma.participantAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOptionKey,
          isCorrect,
          responseTimeMs: scoreResult.responseTimeMs,
          baseScore: scoreResult.baseScore,
          speedBonus: scoreResult.speedBonus,
          streakBonus: scoreResult.streakBonus,
          totalScore: scoreResult.totalScore,
        },
      });
    } else {
      await prisma.participantAnswer.create({
        data: {
          participantId: participant.id,
          quizQuestionId,
          selectedOptionKey,
          isCorrect,
          responseTimeMs: scoreResult.responseTimeMs,
          baseScore: scoreResult.baseScore,
          speedBonus: scoreResult.speedBonus,
          streakBonus: scoreResult.streakBonus,
          totalScore: scoreResult.totalScore,
        },
      });
    }

    // Update participant aggregate stats
    const allAnswers = await prisma.participantAnswer.findMany({
      where: { participantId: participant.id },
    });

    const totalScore = allAnswers.reduce((sum, a) => sum + a.totalScore, 0);
    const correctCount = allAnswers.filter((a) => a.isCorrect).length;
    const wrongCount = allAnswers.filter((a) => !a.isCorrect).length;
    const totalResponseTimeMs = allAnswers.reduce((sum, a) => sum + a.responseTimeMs, 0);

    const currentStreak = isCorrect ? participant.currentStreak + 1 : 0;
    const maxStreak = Math.max(participant.maxStreak, currentStreak);

    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        totalScore,
        correctCount,
        wrongCount,
        currentStreak,
        maxStreak,
        totalResponseTimeMs,
      },
    });

    // Broadcast updated answer counts to host and participants
    await this.broadcastState(joinCode);

    return {
      success: true,
      selectedOptionKey,
      responseTimeMs: scoreResult.responseTimeMs,
    };
  }

  /**
   * Host Controls: START, NEXT_QUESTION, SHOW_ANSWER, SHOW_LEADERBOARD, PAUSE, RESUME, END_QUIZ, KICK
   */
  public async handleHostAction(joinCode: string, action: string, payload?: { participantId?: string }) {
    const session = await prisma.quizSession.findUnique({
      where: { joinCode },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!session) throw new Error('Session not found');

    switch (action) {
      case 'START': {
        // Start quiz from question 0
        await prisma.quizSession.update({
          where: { joinCode },
          data: {
            status: 'LIVE',
            roundState: 'QUESTION',
            currentQuestionIndex: 0,
            questionStartedAt: new Date(),
            startedAt: session.startedAt || new Date(),
          },
        });
        break;
      }

      case 'SHOW_ANSWER': {
        await prisma.quizSession.update({
          where: { joinCode },
          data: {
            roundState: 'REVEAL',
          },
        });
        break;
      }

      case 'SHOW_LEADERBOARD': {
        await prisma.quizSession.update({
          where: { joinCode },
          data: {
            roundState: 'LEADERBOARD',
          },
        });
        break;
      }

      case 'NEXT_QUESTION': {
        const nextIndex = session.currentQuestionIndex + 1;
        if (nextIndex >= session.questions.length) {
          // Finished all questions -> Podium
          await prisma.quizSession.update({
            where: { joinCode },
            data: {
              status: 'FINISHED',
              roundState: 'PODIUM',
              endedAt: new Date(),
            },
          });
        } else {
          await prisma.quizSession.update({
            where: { joinCode },
            data: {
              currentQuestionIndex: nextIndex,
              roundState: 'QUESTION',
              questionStartedAt: new Date(),
            },
          });
        }
        break;
      }

      case 'PAUSE': {
        await prisma.quizSession.update({
          where: { joinCode },
          data: {
            status: 'PAUSED',
          },
        });
        break;
      }

      case 'RESUME': {
        await prisma.quizSession.update({
          where: { joinCode },
          data: {
            status: 'LIVE',
          },
        });
        break;
      }

      case 'END_QUIZ': {
        await prisma.quizSession.update({
          where: { joinCode },
          data: {
            status: 'FINISHED',
            roundState: 'PODIUM',
            endedAt: new Date(),
          },
        });
        break;
      }

      case 'KICK_PARTICIPANT': {
        if (payload?.participantId) {
          await prisma.participant.update({
            where: { id: payload.participantId },
            data: { isKicked: true },
          });
        }
        break;
      }

      default:
        throw new Error(`Unknown host action: ${action}`);
    }

    await this.broadcastState(joinCode);
    return await this.getRoomState(joinCode, true);
  }
}

// Global Singleton
const globalForHub = global as unknown as { quizHub: QuizHub };
export const quizHub = globalForHub.quizHub || new QuizHub();
if (process.env.NODE_ENV !== 'production') globalForHub.quizHub = quizHub;
