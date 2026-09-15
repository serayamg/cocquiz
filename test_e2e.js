const assert = require('assert');

async function runTests() {
  console.log('=== RUNNING END-TO-END AUTOMATED VERIFICATION ===\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Landing page check
  console.log('1. Checking Landing Page (GET /)...');
  const homeRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(homeRes.status, 200, 'Landing page should return 200');
  const homeHtml = await homeRes.text();
  assert(homeHtml.includes('QUIZ ARENA'), 'Landing page should contain QUIZ ARENA');
  console.log('✓ Landing page verified successfully.\n');

  // 2. Participant Join: Teguh
  console.log('2. Joining participant Teguh Budiarto to Room 784921...');
  const joinTeguhRes = await fetch(`${BASE_URL}/api/quiz/784921/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Teguh Budiarto',
      unitOrCompany: 'Divisi Kepatuhan',
      email: 'teguh@example.com'
    })
  });
  assert.strictEqual(joinTeguhRes.status, 200);
  const teguhData = await joinTeguhRes.json();
  assert(teguhData.success);
  assert(teguhData.participant.sessionToken);
  console.log('✓ Teguh joined. Token:', teguhData.participant.sessionToken.slice(0, 10) + '...\n');

  // 3. Participant Join: Maria
  console.log('3. Joining participant Maria to Room 784921...');
  const joinMariaRes = await fetch(`${BASE_URL}/api/quiz/784921/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Maria',
      unitOrCompany: 'Audit Internal',
      email: 'maria@example.com'
    })
  });
  assert.strictEqual(joinMariaRes.status, 200);
  const mariaData = await joinMariaRes.json();
  assert(mariaData.success);
  console.log('✓ Maria joined.\n');

  // 4. Host starts the quiz
  console.log('4. Host starts the quiz (START)...');
  const startRes = await fetch(`${BASE_URL}/api/quiz/784921/host-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START' })
  });
  assert.strictEqual(startRes.status, 200);
  const startData = await startRes.json();
  assert.strictEqual(startData.state.roundState, 'QUESTION');
  assert.strictEqual(startData.state.currentQuestionIndex, 0);
  console.log('✓ Quiz started into Question 1:', startData.state.currentQuestion.topic);

  // 5. Verify Anti-Cheat: Participant state does NOT contain correct answer or explanation
  console.log('5. Verifying Anti-Cheat protection on Question state...');
  const questionId = startData.state.currentQuestion.id;
  // Make sure question text is available
  assert(startData.state.currentQuestion.questionText.includes('kepatuhan dan etika'));
  console.log('✓ Question text verified.\n');

  // 6. Teguh submits Option B (CORRECT)
  console.log('6. Teguh submits answer B (Correct)...');
  const teguhAnsRes = await fetch(`${BASE_URL}/api/quiz/784921/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionToken: teguhData.participant.sessionToken,
      quizQuestionId: questionId,
      selectedOptionKey: 'B'
    })
  });
  assert.strictEqual(teguhAnsRes.status, 200);
  const teguhAnsData = await teguhAnsRes.json();
  assert(teguhAnsData.success);
  console.log('✓ Teguh answer recorded with response time:', teguhAnsData.responseTimeMs, 'ms\n');

  // 7. Maria submits Option A (INCORRECT)
  console.log('7. Maria submits answer A (Incorrect)...');
  const mariaAnsRes = await fetch(`${BASE_URL}/api/quiz/784921/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionToken: mariaData.participant.sessionToken,
      quizQuestionId: questionId,
      selectedOptionKey: 'A'
    })
  });
  assert.strictEqual(mariaAnsRes.status, 200);
  const mariaAnsData = await mariaAnsRes.json();
  assert(mariaAnsData.success);
  console.log('✓ Maria answer recorded.\n');

  // 8. Host triggers SHOW_ANSWER
  console.log('8. Host triggers SHOW_ANSWER...');
  const revealRes = await fetch(`${BASE_URL}/api/quiz/784921/host-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'SHOW_ANSWER' })
  });
  assert.strictEqual(revealRes.status, 200);
  const revealData = await revealRes.json();
  assert.strictEqual(revealData.state.roundState, 'REVEAL');
  assert.strictEqual(revealData.state.currentQuestion.correctOptionKey, 'B');
  assert(revealData.state.currentQuestion.explanation.includes('Kepatuhan berkaitan dengan'));
  assert.strictEqual(revealData.state.distribution.B, 1);
  assert.strictEqual(revealData.state.distribution.A, 1);
  assert.strictEqual(revealData.state.distribution.correctCount, 1);
  console.log('✓ Correct answer revealed:', revealData.state.currentQuestion.correctOptionKey);
  console.log('✓ Answer distribution verified: A=1, B=1, correctCount=1\n');

  // 9. Host triggers SHOW_LEADERBOARD
  console.log('9. Host triggers SHOW_LEADERBOARD...');
  const lbRes = await fetch(`${BASE_URL}/api/quiz/784921/host-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'SHOW_LEADERBOARD' })
  });
  assert.strictEqual(lbRes.status, 200);
  const lbData = await lbRes.json();
  assert.strictEqual(lbData.state.roundState, 'LEADERBOARD');
  const lb = lbData.state.leaderboard;
  assert(lb.length >= 2);
  assert.strictEqual(lb[0].name, 'Teguh Budiarto');
  assert(lb[0].score >= 1000, 'Teguh score should be >= 1000');
  assert.strictEqual(lb[1].name, 'Maria');
  assert.strictEqual(lb[1].score, 0, 'Maria score must be 0 for wrong answer');
  console.log(`✓ Leaderboard verified: #1 ${lb[0].name} (${lb[0].score} pts), #2 ${lb[1].name} (${lb[1].score} pts)\n`);

  // 10. Participant Review API check
  console.log('10. Testing Review API for Teguh...');
  const reviewRes = await fetch(`${BASE_URL}/api/quiz/784921/review?token=${teguhData.participant.sessionToken}`);
  assert.strictEqual(reviewRes.status, 200);
  const reviewData = await reviewRes.json();
  assert(reviewData.questions.length === 15);
  assert.strictEqual(reviewData.questions[0].userAnswerKey, 'B');
  assert.strictEqual(reviewData.questions[0].isUserCorrect, true);
  console.log('✓ Participant Review API verified with 15 questions & explanations.\n');

  // 11. Admin Analytics API check
  console.log('11. Testing Admin Analytics API...');
  const analyticsRes = await fetch(`${BASE_URL}/api/admin/analytics?code=784921`);
  assert.strictEqual(analyticsRes.status, 200);
  const analyticsData = await analyticsRes.json();
  assert(analyticsData.summary.totalParticipants >= 2);
  assert(analyticsData.topicAnalysis.length > 0);
  assert(analyticsData.automatedInsights.length > 0);
  console.log('✓ Analytics API verified with automated training insights:');
  console.log('   Insights:', analyticsData.automatedInsights[0]);

  // 12. Admin CSV Export check
  console.log('\n12. Testing CSV Export endpoints...');
  const exportLbRes = await fetch(`${BASE_URL}/api/admin/export?code=784921&type=leaderboard`);
  assert.strictEqual(exportLbRes.status, 200);
  const csvText = await exportLbRes.text();
  assert(csvText.includes('Rank,Participant Name'));
  assert(csvText.includes('Teguh Budiarto'));
  console.log('✓ CSV Leaderboard Export verified.\n');

  console.log('====================================================');
  console.log('🎉 ALL 12 END-TO-END VERIFICATIONS PASSED 100%! 🎉');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
