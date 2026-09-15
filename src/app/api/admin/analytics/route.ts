import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionCode = req.nextUrl.searchParams.get('code');

    // Filter by session or aggregate across all sessions
    const sessionFilter = sessionCode ? { quizSession: { joinCode: sessionCode } } : {};

    const totalSessions = await prisma.quizSession.count();
    const allParticipants = await prisma.participant.findMany({
      where: sessionCode ? { quizSession: { joinCode: sessionCode } } : {},
      include: {
        answers: {
          include: {
            quizQuestion: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    const totalParticipants = allParticipants.length;

    let totalScoreSum = 0;
    let totalCorrectAnswers = 0;
    let totalAnswers = 0;
    let totalResponseTimeMs = 0;

    // Per question aggregations
    const questionStatsMap: Record<
      string,
      {
        questionId: string;
        text: string;
        topic: string;
        difficulty: string;
        explanation: string;
        correctCount: number;
        wrongCount: number;
        totalTimeMs: number;
      }
    > = {};

    // Per topic aggregations
    const topicStatsMap: Record<
      string,
      {
        topic: string;
        correctCount: number;
        totalCount: number;
      }
    > = {};

    allParticipants.forEach((p) => {
      totalScoreSum += p.totalScore;
      p.answers.forEach((ans) => {
        totalAnswers++;
        if (ans.isCorrect) totalCorrectAnswers++;
        totalResponseTimeMs += ans.responseTimeMs;

        const q = ans.quizQuestion.question;
        if (!questionStatsMap[q.id]) {
          questionStatsMap[q.id] = {
            questionId: q.id,
            text: q.questionText,
            topic: q.topic,
            difficulty: q.difficulty,
            explanation: q.explanation,
            correctCount: 0,
            wrongCount: 0,
            totalTimeMs: 0,
          };
        }

        if (ans.isCorrect) {
          questionStatsMap[q.id].correctCount++;
        } else {
          questionStatsMap[q.id].wrongCount++;
        }
        questionStatsMap[q.id].totalTimeMs += ans.responseTimeMs;

        if (!topicStatsMap[q.topic]) {
          topicStatsMap[q.topic] = {
            topic: q.topic,
            correctCount: 0,
            totalCount: 0,
          };
        }
        topicStatsMap[q.topic].totalCount++;
        if (ans.isCorrect) {
          topicStatsMap[q.topic].correctCount++;
        }
      });
    });

    const avgScore = totalParticipants > 0 ? Math.round(totalScoreSum / totalParticipants) : 0;
    const avgAccuracy = totalAnswers > 0 ? Math.round((totalCorrectAnswers / totalAnswers) * 100) : 0;
    const avgResponseTimeSec = totalAnswers > 0 ? Number((totalResponseTimeMs / totalAnswers / 1000).toFixed(1)) : 0;

    // Question performance list
    const questionPerformance = Object.values(questionStatsMap).map((item) => {
      const attempts = item.correctCount + item.wrongCount;
      const correctPct = attempts > 0 ? Math.round((item.correctCount / attempts) * 100) : 0;
      const wrongPct = 100 - correctPct;
      const avgTimeSec = attempts > 0 ? Number((item.totalTimeMs / attempts / 1000).toFixed(1)) : 0;

      let interpretation = 'Tingkat pemahaman baik.';
      if (correctPct < 50) {
        interpretation = 'Materi ini belum dipahami oleh mayoritas peserta. Perlu pembahasan ulang!';
      } else if (correctPct < 70) {
        interpretation = 'Cukup dipahami, namun masih terdapat keraguan pada opsi pengecoh.';
      }

      return {
        questionId: item.questionId,
        questionText: item.text,
        topic: item.topic,
        difficulty: item.difficulty,
        correctPct,
        wrongPct,
        avgTimeSec,
        attempts,
        interpretation,
      };
    });

    // Topic analysis list
    const topicAnalysis = Object.values(topicStatsMap).map((t) => {
      const accuracy = t.totalCount > 0 ? Math.round((t.correctCount / t.totalCount) * 100) : 0;
      return {
        topic: t.topic,
        accuracy,
        totalAttempts: t.totalCount,
      };
    });

    topicAnalysis.sort((a, b) => b.accuracy - a.accuracy);

    // Automatic Training Insights
    const highTopics = topicAnalysis.filter((t) => t.accuracy >= 75).map((t) => t.topic);
    const lowTopics = topicAnalysis.filter((t) => t.accuracy < 70).map((t) => t.topic);

    const automatedInsights: string[] = [];

    if (topicAnalysis.length > 0) {
      if (highTopics.length > 0) {
        automatedInsights.push(
          `Peserta memiliki tingkat pemahaman tinggi pada topik: ${highTopics.slice(0, 3).join(', ')}.`
        );
      }
      if (lowTopics.length > 0) {
        automatedInsights.push(
          `Masih terdapat pemahaman yang kurang optimal pada topik: ${lowTopics.slice(0, 3).join(', ')}.`
        );
        automatedInsights.push(
          `Disarankan trainer memberikan reinforcement dan studi kasus terarah pada materi ${lowTopics[0]} sebelum penutupan sesi.`
        );
      } else {
        automatedInsights.push(
          'Seluruh topik menunjukkan pemahaman yang solid dan konsisten di atas 70%.'
        );
      }
    } else {
      automatedInsights.push('Belum ada data respons peserta untuk menghasilkan analisis training.');
    }

    return NextResponse.json({
      summary: {
        totalSessions,
        totalParticipants,
        avgScore,
        avgAccuracy,
        avgResponseTimeSec,
        completionRate: totalParticipants > 0 ? 100 : 0,
      },
      questionPerformance,
      topicAnalysis,
      automatedInsights,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
