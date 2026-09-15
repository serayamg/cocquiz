export interface ScoringResult {
  isCorrect: boolean;
  baseScore: number;
  speedBonus: number;
  streakBonus: number;
  totalScore: number;
  newStreak: number;
  responseTimeMs: number;
}

/**
 * Calculates score for a submitted answer based on:
 * - Base points: 1000 (if correct)
 * - Speed bonus: 0 to 500 points (proportional to remaining time)
 * - Streak bonus: +100 when currentStreak >= 3
 * - Strict 0 points if incorrect
 */
export function calculateAnswerScore(params: {
  isCorrect: boolean;
  responseTimeMs: number;
  timeLimitSeconds: number;
  currentStreak: number;
  gameMode?: string;
}): ScoringResult {
  const { isCorrect, responseTimeMs, timeLimitSeconds, currentStreak, gameMode = 'CLASSIC' } = params;

  if (!isCorrect) {
    return {
      isCorrect: false,
      baseScore: 0,
      speedBonus: 0,
      streakBonus: 0,
      totalScore: 0,
      newStreak: 0,
      responseTimeMs: Math.max(0, responseTimeMs),
    };
  }

  const newStreak = currentStreak + 1;
  const baseScore = 1000;

  const totalTimeLimitMs = timeLimitSeconds * 1000;
  const clampedResponseTimeMs = Math.min(Math.max(0, responseTimeMs), totalTimeLimitMs);
  const remainingTimeMs = Math.max(0, totalTimeLimitMs - clampedResponseTimeMs);

  // Speed challenge mode gives up to 750 speed bonus, classic gives up to 500
  const maxSpeedBonus = gameMode === 'SPEED_CHALLENGE' ? 750 : 500;
  const speedBonus = totalTimeLimitMs > 0 
    ? Math.round(maxSpeedBonus * (remainingTimeMs / totalTimeLimitMs)) 
    : 0;

  // Streak bonus: +100 per streak once you hit 3 or more consecutive correct answers
  const streakBonus = newStreak >= 3 ? 100 : 0;

  const totalScore = baseScore + speedBonus + streakBonus;

  return {
    isCorrect: true,
    baseScore,
    speedBonus,
    streakBonus,
    totalScore,
    newStreak,
    responseTimeMs: clampedResponseTimeMs,
  };
}

/**
 * Sorts participants by fair rules:
 * 1. Number of correct answers (descending)
 * 2. Total score (descending)
 * 3. Average response time (ascending)
 */
export function sortLeaderboard<T extends {
  correctCount: number;
  totalScore: number;
  totalResponseTimeMs: number;
}>(participants: T[]): T[] {
  return [...participants].sort((a, b) => {
    // 1. Correct count
    if (b.correctCount !== a.correctCount) {
      return b.correctCount - a.correctCount;
    }
    // 2. Total score
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // 3. Speed (lowest total response time = fastest)
    return a.totalResponseTimeMs - b.totalResponseTimeMs;
  });
}
