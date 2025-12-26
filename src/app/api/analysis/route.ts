import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Constants for analysis
const PRIME_NUMBERS = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);
const FIBONACCI_NUMBERS = new Set([1, 2, 3, 5, 8, 13, 21]);
const MULTIPLES_OF_3 = new Set([3, 6, 9, 12, 15, 18, 21, 24]);
const FRAME_NUMBERS = new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);
const CORE_NUMBERS = new Set([7, 8, 9, 12, 13, 14, 17, 18, 19]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!type) {
      return NextResponse.json({ error: 'Analysis type is required' }, { status: 400 });
    }

    switch (type) {
      case 'longestSeq':
        return await getLongestSeqAnalysis(limit);
      case 'evenCount':
        return await getEvenOddAnalysis(limit);
      case 'sum':
        return await getSumAnalysis(limit);
      case 'rowsWithNumbers':
        return await getRowsWithNumbersAnalysis(limit);
      case 'frameCount':
        return await getFrameCoreAnalysis(limit);
      case 'primeCount':
        return await getSpecialNumbersAnalysis(limit, 'prime');
      case 'groups':
        return await getGroupsAnalysis(limit);
      case 'repeatedFromLast':
        return await getRepeatedAnalysis(limit);
      case 'fibonacciCount':
        return await getSpecialNumbersAnalysis(limit, 'fibonacci');
      case 'lineDistribution':
        return await getLineDistributionAnalysis(limit);
      case 'colDistribution':
        return await getColDistributionAnalysis(limit);
      case 'quadrantCount':
        return await getQuadrantFrequencyAnalysis(limit);
      case 'maxEnding':
        return await getMaxEndingAnalysis(limit);
      case 'multiples':
        return await getMultiplesAnalysis(limit);
      case 'cornerCount':
        return await getCornerCountAnalysis(limit);
      case 'delayedCount':
        return await getDelayedCountAnalysis(limit);
      case 'consecutivePairs':
        return await getConsecutivePairsAnalysis(limit);
      case 'consecutiveTrios':
        return await getConsecutiveTriosAnalysis(limit);
      case 'amplitude':
        return await getAmplitudeAnalysis(limit);
      case 'ciclos':
        return await getCyclesAnalysis();
      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getLongestSeqAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const sortedGame = [...numbers].sort((a, b) => a - b);
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
    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      sequencia: longestSeq
    };
  });

  return NextResponse.json({ data: results });
}

async function getEvenOddAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    let even = 0;
    for (let i = 1; i <= 15; i++) {
      const ball = contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number;
      if (ball % 2 === 0) even++;
    }

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      pares: even,
      impares: 15 - even
    };
  });

  return NextResponse.json({ data: results });
}

async function getSumAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    let sum = 0;
    for (let i = 1; i <= 15; i++) {
      sum += contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number;
    }

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      soma: sum
    };
  });

  return NextResponse.json({ data: results });
}

async function getRowsWithNumbersAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const rowCounts = [0, 0, 0, 0, 0];
    numbers.forEach(n => { rowCounts[Math.ceil(n / 5) - 1]++; });
    const rowsWithNumbers = rowCounts.filter(c => c > 0).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      linhasComNumeros: rowsWithNumbers
    };
  });

  return NextResponse.json({ data: results });
}

async function getFrameCoreAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = new Set<number>();
    for (let i = 1; i <= 15; i++) {
      numbers.add(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }

    const frameCount = [...numbers].filter(n => FRAME_NUMBERS.has(n)).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      moldura: frameCount,
      miolo: 15 - frameCount
    };
  });

  return NextResponse.json({ data: results });
}

async function getSpecialNumbersAnalysis(limit: number, type: 'prime' | 'fibonacci') {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = new Set<number>();
    for (let i = 1; i <= 15; i++) {
      numbers.add(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }

    const count = type === 'prime' 
      ? [...numbers].filter(n => PRIME_NUMBERS.has(n)).length
      : [...numbers].filter(n => FIBONACCI_NUMBERS.has(n)).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      [type === 'prime' ? 'primos' : 'fibonacci']: count
    };
  });

  return NextResponse.json({ data: results });
}

async function getGroupsAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const group1Count = numbers.filter(n => n >= 1 && n <= 9).length;
    const group2Count = numbers.filter(n => n >= 10 && n <= 19).length;
    const group3Count = numbers.filter(n => n >= 20 && n <= 25).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      grupo1: group1Count,
      grupo2: group2Count,
      grupo3: group3Count,
    };
  });

  return NextResponse.json({ data: results });
}

async function getRepeatedAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit + 1,
  });

  const results = [];
  
  for (let i = 0; i < contests.length - 1; i++) {
    const prev = contests[i + 1];
    const curr = contests[i];
    
    const prevNumbers = new Set();
    const currNumbers = new Set();
    
    for (let j = 1; j <= 15; j++) {
      prevNumbers.add(prev[`bola${j.toString().padStart(2, '0')}` as keyof typeof prev] as number);
      currNumbers.add(curr[`bola${j.toString().padStart(2, '0')}` as keyof typeof curr] as number);
    }
    
    const repeated = [...currNumbers].filter(n => prevNumbers.has(n)).length;
    
    results.push({
      concurso: curr.concurso,
      dataSorteio: curr.dataSorteio,
      repetidas: repeated
    });
  }

  return NextResponse.json({ data: results });
}

async function getLineDistributionAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const rowCounts = [0, 0, 0, 0, 0];
    numbers.forEach(n => { rowCounts[Math.ceil(n / 5) - 1]++; });
    const linesTooFull = rowCounts.some(c => c >= 7);
    const linesEmpty = rowCounts.filter(c => c === 0).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      linhasCheias: linesTooFull,
      linhasVazias: linesEmpty
    };
  });

  return NextResponse.json({ data: results });
}

async function getColDistributionAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const colCounts = [0, 0, 0, 0, 0];
    numbers.forEach(n => { colCounts[((n - 1) % 5)]++; });
    const colsTooFull = colCounts.some(c => c >= 7);
    const colsEmpty = colCounts.filter(c => c === 0).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      colunasCheias: colsTooFull,
      colunasVazias: colsEmpty
    };
  });

  return NextResponse.json({ data: results });
}

async function getQuadrantFrequencyAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const quadrants = {
        q1: numbers.filter(n => n <= 13 && (n % 5 <= 3 && n % 5 !== 0) ).length > 0,
        q2: numbers.filter(n => n <= 15 && (n % 5 > 3 || n % 5 === 0) ).length > 0,
        q3: numbers.filter(n => n >= 16 && (n % 5 <= 3 && n % 5 !== 0) ).length > 0,
        q4: numbers.filter(n => n >= 16 && (n % 5 > 3 || n % 5 === 0) ).length > 0,
    };
    const quadrantCount = Object.values(quadrants).filter(Boolean).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      quadrantes: quadrantCount
    };
  });

  return NextResponse.json({ data: results });
}

async function getMaxEndingAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const endings = new Map<number, number>();
    numbers.forEach(n => {
        const lastDigit = n % 10;
        endings.set(lastDigit, (endings.get(lastDigit) || 0) + 1);
    });
    const maxEnding = Math.max(0, ...endings.values());

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      maxTerminacao: maxEnding
    };
  });

  return NextResponse.json({ data: results });
}

async function getMultiplesAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const multiplesOf3Count = numbers.filter(n => n % 3 === 0).length;
    const multiplesOf5Count = numbers.filter(n => n % 5 === 0).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      mult3: multiplesOf3Count,
      mult5: multiplesOf5Count
    };
  });

  return NextResponse.json({ data: results });
}

async function getCornerCountAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const corners = [1, 5, 21, 25];
    const cornerCount = numbers.filter(n => corners.includes(n)).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      cantos: cornerCount
    };
  });

  return NextResponse.json({ data: results });
}

async function getDelayedCountAnalysis(limit: number) {
  const lastTenContests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: 10,
  });

  const allNumbersInLastTen = new Set<number>();
  lastTenContests.forEach(c => {
    for (let i = 1; i <= 15; i++) {
      allNumbersInLastTen.add(c[`bola${i.toString().padStart(2, '0')}` as keyof typeof c] as number);
    }
  });
  const delayedNumbers = new Set<number>();
  for (let i = 1; i <= 25; i++) {
    if (!allNumbersInLastTen.has(i)) {
      delayedNumbers.add(i);
    }
  }

  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const delayedCount = numbers.filter(n => delayedNumbers.has(n)).length;

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      atrasadas: delayedCount
    };
  });

  return NextResponse.json({ data: results });
}

async function getConsecutivePairsAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const sortedGame = [...numbers].sort((a, b) => a - b);
    let consecutivePairs = 0;
    const consecutivePairSequences = [];
    for (let j = 0; j < sortedGame.length - 1; j++) {
        if (sortedGame[j+1] === sortedGame[j] + 1) {
            consecutivePairs++;
            consecutivePairSequences.push(`${sortedGame[j]}-${sortedGame[j+1]}`);
        }
    }

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      paresConsecutivos: consecutivePairs,
      sequencias: consecutivePairSequences.join(', ')
    };
  });

  return NextResponse.json({ data: results });
}

async function getConsecutiveTriosAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const sortedGame = [...numbers].sort((a, b) => a - b);
    let consecutiveTrios = 0;
    const consecutiveTrioSequences = [];
    for (let j = 0; j < sortedGame.length - 2; j++) {
      if (sortedGame[j+1] === sortedGame[j] + 1 && sortedGame[j+2] === sortedGame[j] + 2) {
        consecutiveTrios++;
        consecutiveTrioSequences.push(`${sortedGame[j]}-${sortedGame[j+1]}-${sortedGame[j+2]}`);
      }
    }

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      trios: consecutiveTrios,
      sequencias: consecutiveTrioSequences.join(', ')
    };
  });

  return NextResponse.json({ data: results });
}

async function getAmplitudeAnalysis(limit: number) {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'desc' },
    take: limit,
  });

  const results = contests.map(contest => {
    const numbers = [];
    for (let i = 1; i <= 15; i++) {
      numbers.push(contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number);
    }
    const sortedGame = [...numbers].sort((a, b) => a - b);
    const amplitude = sortedGame[14] - sortedGame[0];

    return {
      concurso: contest.concurso,
      dataSorteio: contest.dataSorteio,
      amplitude: amplitude
    };
  });

  return NextResponse.json({ data: results });
}

async function getCyclesAnalysis() {
  const contests = await db.contest.findMany({
    orderBy: { concurso: 'asc' },
  });

  const allNumbers = new Set<number>();
  const closedCycles = [];
  let cycleStart = contests[0]?.concurso || 0;
  let currentCycleNumbers = new Set<number>();

  for (const contest of contests) {
    for (let i = 1; i <= 15; i++) {
      const ball = contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number;
      currentCycleNumbers.add(ball);
      allNumbers.add(ball);
    }

    if (currentCycleNumbers.size === 25) {
      closedCycles.push({
        start: cycleStart,
        end: contest.concurso,
        size: contest.concurso - cycleStart + 1
      });
      cycleStart = contest.concurso + 1;
      currentCycleNumbers.clear();
    }
  }

  const summary = {
    totalClosedCycles: closedCycles.length,
    averageSize: closedCycles.length > 0 
      ? (closedCycles.reduce((sum, cycle) => sum + cycle.size, 0) / closedCycles.length).toFixed(2)
      : 0,
    longestCycle: closedCycles.length > 0 ? closedCycles.reduce((max, cycle) => cycle.size > max.size ? cycle : max) : null,
    shortestCycle: closedCycles.length > 0 ? closedCycles.reduce((min, cycle) => cycle.size < min.size ? cycle : min) : null,
    currentCycle: currentCycleNumbers.size < 25 ? {
      start: cycleStart,
      size: contests[contests.length - 1]?.concurso - cycleStart + 1 || 0,
      missingNumbers: Array.from({ length: 25 }, (_, i) => i + 1)
        .filter(n => !currentCycleNumbers.has(n))
        .sort((a, b) => a - b)
    } : null
  };

  return NextResponse.json({ data: summary });
}