import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FRAME_NUMBERS, PRIME_NUMBERS } from '@/lib/analysis';
import { WHEEL_18_15_14_15 } from '@/lib/wheeling-systems';

function generateCombinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  const n = arr.length;

  function backtrack(start: number, currentCombination: T[]) {
    if (currentCombination.length === k) {
      result.push([...currentCombination]);
      return;
    }

    if (start >= n || currentCombination.length + (n - start) < k) {
      return;
    }

    for (let i = start; i < n; i++) {
      currentCombination.push(arr[i]);
      backtrack(i + 1, currentCombination);
      currentCombination.pop();
    }
  }

  backtrack(0, []);
  return result;
}

function checkGameAgainstFilters(game: number[], filters: string[], lastContestNumbers: Set<number>): boolean {
  if (filters.length === 0) {
    return true; // No filters, always pass
  }

  const gameSet = new Set(game);

  const stats: { [key: string]: number } = {
    evenCount: game.filter(n => n % 2 === 0).length,
    sum: game.reduce((a, b) => a + b, 0),
    frameCount: game.filter(n => FRAME_NUMBERS.has(n)).length,
    primeCount: game.filter(n => PRIME_NUMBERS.has(n)).length,
    repeatedFromLast: lastContestNumbers.size > 0 ? game.filter(n => lastContestNumbers.has(n)).length : 9, // Default to 9 if no last contest
    longestSeq: 0, // calculated below
    rowsWithNumbers: new Set(game.map(n => Math.ceil(n / 5))).size,
  };

  const sorted = [...gameSet].sort((a, b) => a - b);
  let longestSeq = 1;
  let currentSeq = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentSeq++;
      longestSeq = Math.max(longestSeq, currentSeq);
    } else {
      currentSeq = 1;
    }
  }
  stats.longestSeq = longestSeq;

  const criteria: { [key: string]: () => boolean } = {
    evenCount: () => stats.evenCount >= 7 && stats.evenCount <= 8,
    sum: () => stats.sum >= 171 && stats.sum <= 220,
    frameCount: () => stats.frameCount >= 9 && stats.frameCount <= 11,
    primeCount: () => stats.primeCount >= 3 && stats.primeCount <= 7,
    repeatedFromLast: () => stats.repeatedFromLast >= 8 && stats.repeatedFromLast <= 10,
    longestSeq: () => stats.longestSeq < 5,
    rowsWithNumbers: () => stats.rowsWithNumbers >= 4,
  };

  for (const filter of filters) {
    if (criteria[filter] && !criteria[filter]()) {
      return false; // Fails this filter
    }
  }

  return true; // Passes all filters
}

export async function POST(request: Request) {
  try {
    const { numbers, filters, type = 'integral' } = await request.json();

    if (!numbers || !Array.isArray(numbers)) {
      return NextResponse.json({ error: 'É necessário fornecer um array de números.' }, { status: 400 });
    }

    let generatedGames: number[][] = [];
    let originalGameCount = 0;

    if (type === 'garantia_18_15_14') {
      if (numbers.length !== 18) {
        return NextResponse.json({ error: 'Para este tipo de fechamento, é necessário selecionar exatamente 18 dezenas.' }, { status: 400 });
      }
      // Mapeia os índices da matriz para as dezenas escolhidas pelo usuário
      generatedGames = WHEEL_18_15_14_15.matrix.map(gameIndices =>
        gameIndices.map(index => numbers[index])
      );
      originalGameCount = WHEEL_18_15_14_15.totalGames;

    } else { // Fallback para o fechamento integral
      if (numbers.length < 15) {
        return NextResponse.json({ error: 'É necessário fornecer um array com pelo menos 15 números.' }, { status: 400 });
      }
      generatedGames = generateCombinations(numbers, 15);
      originalGameCount = generatedGames.length;

      if (originalGameCount > 40000) {
        return NextResponse.json({ error: `Este fechamento gera ${originalGameCount} jogos, o que é muito grande para ser processado. Selecione menos dezenas.` }, { status: 400 });
      }
    }

    let filteredGames = generatedGames;
    if (filters && filters.length > 0) {
      const latestContest = await db.contest.findFirst({
        orderBy: { concurso: 'desc' },
      });

      const lastContestNumbers = new Set<number>();
      if (latestContest) {
        for (let i = 1; i <= 15; i++) {
          lastContestNumbers.add(latestContest[`bola${i.toString().padStart(2, '0')}` as keyof typeof latestContest] as number);
        }
      }

      filteredGames = generatedGames.filter(game => checkGameAgainstFilters(game, filters, lastContestNumbers));
    }

    return NextResponse.json({
      message: `Fechamento gerado com sucesso. ${originalGameCount} jogos gerados, ${filteredGames.length} após filtros.`,
      totalGames: filteredGames.length,
      games: filteredGames,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Ocorreu um erro ao gerar os fechamentos.' }, { status: 500 });
  }
}