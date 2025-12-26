import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FRAME_NUMBERS, isGameBalanced, PRIME_NUMBERS, FIBONACCI_NUMBERS } from '@/lib/analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategy, numGames } = body;

    if (!strategy || !numGames) {
      return NextResponse.json(
        { error: 'Strategy and numGames are required' },
        { status: 400 }
      );
    }

    const games = await generateGames(strategy, numGames);
    
    return NextResponse.json({
      games,
      strategy,
      count: games.length
    });
  } catch (error) {
    console.error('Error generating games:', error);
    return NextResponse.json(
      { error: 'Failed to generate games' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { games, analyses } = body;

    if (!games || !Array.isArray(games)) {
      return NextResponse.json(
        { error: 'Games array is required' },
        { status: 400 }
      );
    }

    // Convert game strings to numbers
    const gamesAsNumbers = games.map((game: (string | number)[]) =>
      game.map(num => (typeof num === 'string' ? parseInt(num, 10) : num))
    );

    const analysis = await analyzeGamesQuality(gamesAsNumbers, analyses);
    
    return NextResponse.json({
      analysis,
      totalGames: games.length
    });
  } catch (error) {
    console.error('Error analyzing games:', error);
    return NextResponse.json(
      { error: `Failed to analyze games: ${error.message}` },
      { status: 500 }
    );
  }
}

async function generateGames(strategy: string, numGames: number): Promise<number[][]> {
  switch (strategy) {
    case 'random':
      return generateRandomGames(numGames);
    case 'pattern':
      return await generatePatternGames(numGames);
    case 'mostFrequent':
      return await generateMostFrequentGames(numGames);
    case 'leastFrequent':
      return await generateLeastFrequentGames(numGames);
    case 'cycleClosure':
      return await generateCycleClosureGames(numGames);
    default:
      return generateRandomGames(numGames);
  }
}

function generateRandomGames(numGames: number): number[][] {
  const games = [];
  for (let i = 0; i < numGames; i++) {
    const numbers = new Set<number>();
    while (numbers.size < 15) {
      numbers.add(Math.floor(Math.random() * 25) + 1);
    }
    games.push(Array.from(numbers).sort((a, b) => a - b));
  }
  return games;
}

async function generatePatternGames(numGames: number): Promise<number[][]> {
  const latestContest = await db.contest.findFirst({
    orderBy: { concurso: 'desc' }
  });

  if (!latestContest) {
    return generateRandomGames(numGames);
  }

  const lastNumbers = new Set<number>();
  for (let i = 1; i <= 15; i++) {
    lastNumbers.add(latestContest[`bola${i.toString().padStart(2, '0')}` as keyof typeof latestContest] as number);
  }

  const games = [];
  let attempts = 0;
  const maxAttempts = 100000;

  while (games.length < numGames && attempts < maxAttempts) {
    attempts++;
    const game = generateRandomGames(1)[0];
    
    if (isGameBalanced(game, lastNumbers)) {
      games.push(game);
    }
  }

  return games.length > 0 ? games : generateRandomGames(numGames);
}

async function generateMostFrequentGames(numGames: number): Promise<number[][]> {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: 100,
  });

  const frequency = new Map<number, number>();
  
  contests.forEach(contest => {
    for (let i = 1; i <= 15; i++) {
      const ball = contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number;
      frequency.set(ball, (frequency.get(ball) || 0) + 1);
    }
  });

  const mostFrequent = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([number]) => number);

  if (mostFrequent.length < 15) {
    return generateRandomGames(numGames);
  }

  const games = [];
  for (let i = 0; i < numGames; i++) {
    const selected = new Set<number>();
    while (selected.size < 15) {
      const randomIndex = Math.floor(Math.random() * mostFrequent.length);
      selected.add(mostFrequent[randomIndex]);
    }
    games.push(Array.from(selected).sort((a, b) => a - b));
  }

  return games;
}

async function generateLeastFrequentGames(numGames: number): Promise<number[][]> {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: 100,
  });

  const frequency = new Map<number, number>();
  
  contests.forEach(contest => {
    for (let i = 1; i <= 15; i++) {
      const ball = contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number;
      frequency.set(ball, (frequency.get(ball) || 0) + 1);
    }
  });

  const leastFrequent = Array.from(frequency.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(0, 18)
    .map(([number]) => number);

  if (leastFrequent.length < 15) {
    return generateRandomGames(numGames);
  }

  const games = [];
  for (let i = 0; i < numGames; i++) {
    const selected = new Set<number>();
    while (selected.size < 15) {
      const randomIndex = Math.floor(Math.random() * leastFrequent.length);
      selected.add(leastFrequent[randomIndex]);
    }
    games.push(Array.from(selected).sort((a, b) => a - b));
  }

  return games;
}

async function generateCycleClosureGames(numGames: number): Promise<number[][]> {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'asc' },
  });

  const allNumbers = new Set<number>();
  const currentCycleNumbers = new Set<number>();

  for (const contest of contests) {
    for (let i = 1; i <= 15; i++) {
      const ball = contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number;
      currentCycleNumbers.add(ball);
      allNumbers.add(ball);
    }

    if (currentCycleNumbers.size === 25) {
      currentCycleNumbers.clear();
    }
  }

  const missingNumbers = Array.from({ length: 25 }, (_, i) => i + 1)
    .filter(n => !currentCycleNumbers.has(n));

  if (missingNumbers.length === 0) {
    return generateRandomGames(numGames);
  }

  const remainingNumbers = Array.from({ length: 25 }, (_, i) => i + 1)
    .filter(n => !missingNumbers.includes(n));

  const games = [];
  for (let i = 0; i < numGames; i++) {
    const game = [...missingNumbers];
    const needed = 15 - missingNumbers.length;
    
    if (needed > 0 && remainingNumbers.length >= needed) {
      const shuffled = [...remainingNumbers].sort(() => Math.random() - 0.5);
      game.push(...shuffled.slice(0, needed));
    }
    
    if (game.length === 15) {
      games.push(game.sort((a, b) => a - b));
    }
  }

  return games.length > 0 ? games : generateRandomGames(numGames);
}

async function analyzeGamesQuality(games: number[][], analyses: string[]): Promise<any[]> {
  const results = [];

  // Fetch data needed for analysis
  const latestContest = await db.contest.findFirst({
    orderBy: { concurso: 'desc' },
  });
  const lastTenContests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: 10,
  });

  const lastContestNumbers = new Set<number>();
  if (latestContest) {
    for (let i = 1; i <= 15; i++) {
      lastContestNumbers.add(latestContest[`bola${i.toString().padStart(2, '0')}` as keyof typeof latestContest] as number);
    }
  }

  const delayedNumbers = new Set<number>();
  if (lastTenContests.length > 0) {
    const allNumbersInLastTen = new Set<number>();
    lastTenContests.forEach(c => {
      for (let i = 1; i <= 15; i++) {
        allNumbersInLastTen.add(c[`bola${i.toString().padStart(2, '0')}` as keyof typeof c] as number);
      }
    });
    for (let i = 1; i <= 25; i++) {
      if (!allNumbersInLastTen.has(i)) {
        delayedNumbers.add(i);
      }
    }
  }

  const analysisCriteria = {
    alreadyDrawn: { weight: 100, check: (stats: any) => stats.alreadyDrawn },
    longestSeq: { weight: 25, check: (stats: any) => stats.sequenciaMaxima >= 5 },
    evenCount: { weight: 20, check: (stats: any) => stats.pares < 7 || stats.pares > 8 },
    sum: { weight: 20, check: (stats: any) => stats.soma < 171 || stats.soma > 220 },
    rowsWithNumbers: { weight: 20, check: (stats: any) => stats.linhas < 4 },
    frameCount: { weight: 15, check: (stats: any) => stats.moldura < 9 || stats.moldura > 11 },
    primeCount: { weight: 15, check: (stats: any) => stats.primos < 3 || stats.primos > 7 },
    groups: { weight: 15, check: (stats: any) => stats.group1Count < 4 || stats.group1Count > 6 || stats.group2Count < 5 || stats.group2Count > 7 || stats.group3Count < 3 || stats.group3Count > 5 },
    repeatedFromLast: { weight: 15, check: (stats: any) => stats.repetidas < 7 || stats.repetidas > 11 },
    fibonacciCount: { weight: 10, check: (stats: any) => stats.fibonacci < 2 || stats.fibonacci > 6 },
    lineDistribution: { weight: 10, check: (stats: any) => stats.linesTooFull || stats.linesEmpty >= 3 },
    colDistribution: { weight: 10, check: (stats: any) => stats.colsEmpty >= 3 || stats.colsTooFull },
    quadrantCount: { weight: 10, check: (stats: any) => stats.quadrantes <= 2 },
    maxEnding: { weight: 10, check: (stats: any) => stats.terminacoes > 4 },
    multiples: { weight: 8, check: (stats: any) => stats.mult3 < 3 || stats.mult3 > 5 || stats.multiplesOf5Count < 2 || stats.multiplesOf5Count > 3 },
    cornerCount: { weight: 8, check: (stats: any) => stats.cantos === 0 || stats.cantos === 4 },
    delayedCount: { weight: 8, check: (stats: any) => stats.atrasadas > 4 },
    consecutivePairs: { weight: 8, check: (stats: any) => stats.duplas < 2 || stats.duplas > 7 },
    consecutiveTrios: { weight: 8, check: (stats: any) => stats.trios >= 2 },
    amplitude: { weight: 5, check: (stats: any) => stats.amplitude < 15 },
  };

  const selectedCriteria = analyses.filter(id => analysisCriteria[id]);
  const totalWeight = selectedCriteria.reduce((sum, id) => sum + analysisCriteria[id].weight, 0);

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const gameSet = new Set(game);
    const sortedGame = [...game].sort((a, b) => a - b);

    // --- Basic statistics ---
    const evenCount = game.filter(n => n % 2 === 0).length;
    const oddCount = 15 - evenCount;
    const frameCount = game.filter(n => FRAME_NUMBERS.has(n)).length;
    const coreCount = 15 - frameCount;
    const multiplesOf3Count = game.filter(n => n % 3 === 0).length;
    const fibonacciCount = game.filter(n => FIBONACCI_NUMBERS.has(n)).length;
    const primeCount = game.filter(n => PRIME_NUMBERS.has(n)).length;
    const sum = game.reduce((a, b) => a + b, 0);

    // --- New statistics ---
    const group1Count = game.filter(n => n >= 1 && n <= 9).length;
    const group2Count = game.filter(n => n >= 10 && n <= 19).length;
    const group3Count = game.filter(n => n >= 20 && n <= 25).length;

    const repeatedFromLast = latestContest ? game.filter(n => lastContestNumbers.has(n)).length : 0;

    const rowCounts = [0, 0, 0, 0, 0];
    game.forEach(n => { rowCounts[Math.ceil(n / 5) - 1]++; });
    const rowsWithNumbers = rowCounts.filter(c => c > 0).length;
    const linesTooFull = rowCounts.some(c => c >= 7);
    const linesEmpty = rowCounts.filter(c => c === 0).length;


    const colCounts = [0, 0, 0, 0, 0];
    game.forEach(n => { colCounts[((n - 1) % 5)]++; });
    const colsWithNumbers = colCounts.filter(c => c > 0).length;
    const colsTooFull = colCounts.some(c => c >= 7);
    const colsEmpty = colCounts.filter(c => c === 0).length;


    const quadrants = {
        q1: game.filter(n => n <= 13 && (n % 5 <= 3 && n % 5 !== 0) ).length > 0,
        q2: game.filter(n => n <= 15 && (n % 5 > 3 || n % 5 === 0) ).length > 0,
        q3: game.filter(n => n >= 16 && (n % 5 <= 3 && n % 5 !== 0) ).length > 0,
        q4: game.filter(n => n >= 16 && (n % 5 > 3 || n % 5 === 0) ).length > 0,
    };
    const quadrantCount = Object.values(quadrants).filter(Boolean).length;


    const endings = new Map<number, number>();
    game.forEach(n => {
        const lastDigit = n % 10;
        endings.set(lastDigit, (endings.get(lastDigit) || 0) + 1);
    });
    const maxEnding = Math.max(0, ...endings.values());

    const multiplesOf5Count = game.filter(n => n % 5 === 0).length;

    const corners = [1, 5, 21, 25];
    const cornerCount = game.filter(n => corners.includes(n)).length;

    const delayedCount = game.filter(n => delayedNumbers.has(n)).length;

    let consecutivePairs = 0;
    const consecutivePairSequences = [];
    for (let j = 0; j < sortedGame.length - 1; j++) {
        if (sortedGame[j+1] === sortedGame[j] + 1) {
            consecutivePairs++;
            consecutivePairSequences.push(`${sortedGame[j]}-${sortedGame[j+1]}`);
        }
    }

    let consecutiveTrios = 0;
    const consecutiveTrioSequences = [];
    for (let j = 0; j < sortedGame.length - 2; j++) {
      if (sortedGame[j+1] === sortedGame[j] + 1 && sortedGame[j+2] === sortedGame[j] + 2) {
        consecutiveTrios++;
        consecutiveTrioSequences.push(`${sortedGame[j]}-${sortedGame[j+1]}-${sortedGame[j+2]}`);
      }
    }

    const amplitude = sortedGame[14] - sortedGame[0];


    // Longest sequence
    let longestSeq = 0;
    let currentSeq = 1;
    if (sortedGame.length > 0) {
        longestSeq = 1;
        for (let j = 1; j < sortedGame.length; j++) {
          if (sortedGame[j] === sortedGame[j - 1] + 1) {
            currentSeq++;
          } else {
            currentSeq = 1;
          }
          longestSeq = Math.max(longestSeq, currentSeq);
        }
    }


    // Check if game already exists
    const existingGame = await db.contest.findFirst({
      where: {
        AND: sortedGame.map((num, index) => ({
          [`bola${(index + 1).toString().padStart(2, '0')}`]: num
        }))
      }
    });

    const stats = {
      pares: evenCount,
      impares: oddCount,
      moldura: frameCount,
      miolo: coreCount,
      mult3: multiplesOf3Count,
      fibonacci: fibonacciCount,
      primos: primeCount,
      soma: sum,
      linhas: rowsWithNumbers,
      sequenciaMaxima: longestSeq,
      repetidas: repeatedFromLast,
      colunas: colsWithNumbers,
      quadrantes: quadrantCount,
      terminacoes: maxEnding,
      cantos: cornerCount,
      atrasadas: delayedCount,
      duplas: consecutivePairs,
      trios: consecutiveTrios,
      amplitude: amplitude,
      group1Count,
      group2Count,
      group3Count,
      linesTooFull,
      linesEmpty,
      colsEmpty,
      colsTooFull,
      multiplesOf5Count,
      alreadyDrawn: !!existingGame
    };

    let scorePenalty = 0;
    if (totalWeight > 0) {
      for (const id of selectedCriteria) {
        if (analysisCriteria[id] && analysisCriteria[id].check(stats)) {
          scorePenalty += analysisCriteria[id].weight;
        }
      }
    }

    let qualityScore = totalWeight > 0 ? Math.max(0, 100 - (scorePenalty / totalWeight) * 100) : 100;

    results.push({
      gameIndex: i + 1,
      game: game.map(n => n.toString().padStart(2, '0')),
      statistics: {
        pares: evenCount,
        impares: oddCount,
        moldura: frameCount,
        miolo: coreCount,
        mult3: multiplesOf3Count,
        fibonacci: fibonacciCount,
        primos: primeCount,
        soma: sum,
        linhas: rowsWithNumbers,
        sequenciaMaxima: longestSeq,
        // new stats
        repetidas: repeatedFromLast,
        colunas: colsWithNumbers,
        quadrantes: quadrantCount,
        terminacoes: maxEnding,
        cantos: cornerCount,
        atrasadas: delayedCount,
        duplas: consecutivePairs,
        duplaSequences: consecutivePairSequences.join(', '),
        trios: consecutiveTrios,
        trioSequences: consecutiveTrioSequences.join(', '),
        amplitude: amplitude,
      },
      qualityScore: Math.round(qualityScore),
      alreadyDrawn: !!existingGame,
      isValid: qualityScore > 50
    });
  }

  return results;
}