import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateQualityScore } from '@/lib/quality-score';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { games } = body;

    if (!games || !Array.isArray(games)) {
      return NextResponse.json({ error: 'Invalid input. "games" must be an array.' }, { status: 400 });
    }

    // 1. Fetch all contests from the database
    const allContests = await db.contest.findMany({
      orderBy: { concurso: 'asc' },
    });

    // 2. Process all contests into a more searchable format (Mega Sena: 6 balls)
    const processedContests = allContests.map(contest => {
      const numbers = [
        contest.bola01, contest.bola02, contest.bola03,
        contest.bola04, contest.bola05, contest.bola06,
      ].sort((a, b) => a - b);
      return {
        concurso: contest.concurso,
        dataSorteio: contest.dataSorteio,
        numbers: numbers.map(n => String(n).padStart(2, '0')), // For consistent string comparison
      };
    });

    // Get latest contest numbers for "repeated" metric (Mega Sena: 6 balls)
    const latestContest = allContests[allContests.length - 1];
    const latestNumbers = latestContest ? [
      latestContest.bola01, latestContest.bola02, latestContest.bola03,
      latestContest.bola04, latestContest.bola05, latestContest.bola06,
    ] : [];

    const results: any[] = [];
    let foundCount = 0;

    // 3. Check each user-submitted game
    for (const userGame of games) {
      if (!Array.isArray(userGame) || userGame.length !== 6) {
        continue; // Skip invalid game formats
      }

      // Normalize user game for comparison
      // Ensure numbers are strings padded with 0 and sorted
      const userGameNumbers = userGame.map(Number).sort((a, b) => a - b);
      const userGameSorted = userGameNumbers.map(n => String(n).padStart(2, '0'));
      const userGameStr = userGameSorted.join(',');

      // Calculate Quality Score
      const quality = calculateQualityScore(userGameNumbers);

      // Calculate repeated from last contest
      if (latestNumbers.length > 0) {
        const repeatedCount = userGameNumbers.filter(n => latestNumbers.includes(n)).length;
        quality.metrics.repeatedCount = repeatedCount;
      }

      let isDrawn = false;
      let matchedContest: { concurso: number; dataSorteio: Date } | null = null;

      for (const contest of processedContests) {
        // Check if the user's 6 numbers exactly match the 6 drawn numbers
        const contestNumbers = contest.numbers; // Array of strings (6 numbers)
        const userGameStr = userGameSorted.join(',');
        const contestStr = contestNumbers.join(',');

        if (userGameStr === contestStr) {
          isDrawn = true;
          matchedContest = {
            concurso: contest.concurso,
            dataSorteio: contest.dataSorteio
          };
          foundCount++;
          break;
        }
      }

      if (isDrawn) {
        quality.score = 0;
        quality.violations.push('Jogo já premiado com 6 acertos (sena)');
      }

      results.push({
        game: userGame, // Return original input format
        isDrawn,
        contest: matchedContest,
        quality // Add quality score result
      });
    }

    return NextResponse.json({
      results: results,
      message: `Conferência concluída. ${foundCount} jogo(s) premiado(s) com 6 acertos (sena) em concursos passados.`
    });

  } catch (error) {
    console.error('Error checking games:', error);
    return NextResponse.json(
      { error: 'Failed to check games' },
      { status: 500 }
    );
  }
}
