import { db } from '@/lib/db';
import { cacheData, getCachedData } from './cache';
import { performanceMonitor } from './performance';
import logger from './logger';
import { MEGASENA_CONFIG } from './megasena-constants';

export interface CycleStats {
  [key: number]: {
    mu: number; // mean of historical cycles
    sd: number; // standard deviation of historical cycles
    currentCycle: number; // length of current incomplete cycle
    historicalCycles: number[]; // all past cycle lengths
    empProbWithin5: number; // empirical probability of closing within 5 contests
    urgencyScore: number; // score based on how late the number is
    frequency: number; // relative frequency (appearances / total contests)
    frequencyZScore: number; // Z-score of frequency
    weightedScore: number; // combined score of urgency and frequency
  };
}

export class CycleAnalyzer {
  private static instance: CycleAnalyzer;
  private readonly CACHE_KEY = 'cycle_stats_megasena_v1';
  private readonly CACHE_TTL = 3600; // 1 hour

  private constructor() { }

  public static getInstance(): CycleAnalyzer {
    if (!CycleAnalyzer.instance) {
      CycleAnalyzer.instance = new CycleAnalyzer();
    }
    return CycleAnalyzer.instance;
  }

  async getCycleStats(): Promise<CycleStats> {
    return await performanceMonitor.trackOperation('getCycleStats', async () => {
      // Try to get from cache first
      const cached = await getCachedData<CycleStats>(this.CACHE_KEY);
      if (cached) {
        logger.info('Cache hit for cycle stats');
        return cached;
      }

      logger.info('Cache miss for cycle stats, calculating...');

      const contests = await db.contest.findMany({
        orderBy: { concurso: 'asc' },
        select: {
          concurso: true,
          bola01: true, bola02: true, bola03: true,
          bola04: true, bola05: true, bola06: true
        }
      });

      // Arrays para rastrear ciclos (1-60)
      const lastSeen = new Int32Array(MEGASENA_CONFIG.TOTAL_NUMBERS + 1).fill(0);
      const currentCycle = new Int32Array(MEGASENA_CONFIG.TOTAL_NUMBERS + 1).fill(0);
      const historicalCycles: number[][] = Array.from(
        { length: MEGASENA_CONFIG.TOTAL_NUMBERS + 1 },
        () => []
      );

      // Pre-allocate array for draw numbers
      const drawNumbers = new Int32Array(MEGASENA_CONFIG.NUMBERS_DRAWN);

      for (const contest of contests) {
        drawNumbers[0] = contest.bola01;
        drawNumbers[1] = contest.bola02;
        drawNumbers[2] = contest.bola03;
        drawNumbers[3] = contest.bola04; drawNumbers[4] = contest.bola05;
        drawNumbers[5] = contest.bola06;

        // Create a boolean array for O(1) lookup
        const isPresent = new Int8Array(MEGASENA_CONFIG.TOTAL_NUMBERS + 1).fill(0);
        for (let k = 0; k < MEGASENA_CONFIG.NUMBERS_DRAWN; k++) {
          isPresent[drawNumbers[k]] = 1;
        }

        // Update cycles for all numbers (1-60)
        for (let i = MEGASENA_CONFIG.MIN_NUMBER; i <= MEGASENA_CONFIG.MAX_NUMBER; i++) {
          if (isPresent[i]) {
            if (lastSeen[i] !== 0) {
              historicalCycles[i].push(contest.concurso - lastSeen[i]);
            }
            lastSeen[i] = contest.concurso;
            currentCycle[i] = 0;
          } else {
            currentCycle[i]++;
          }
        }
      }

      const stats: CycleStats = {};

      // Calculate stats for each number (1-60)
      for (let i = MEGASENA_CONFIG.MIN_NUMBER; i <= MEGASENA_CONFIG.MAX_NUMBER; i++) {
        const cycles = historicalCycles[i];
        let mu = 0;
        let sd = 0;
        let empProbWithin5 = 0;
        let urgencyScore = 0;

        if (cycles.length > 0) {
          const sum = cycles.reduce((a, b) => a + b, 0);
          mu = sum / cycles.length;

          if (cycles.length > 1) {
            const variance = cycles.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / (cycles.length - 1);
            sd = Math.sqrt(variance);
          }

          const current = currentCycle[i];

          // Empirical probability: survival function approach
          const cyclesAtLeastCurrent = cycles.filter(c => c >= current);
          if (cyclesAtLeastCurrent.length > 0) {
            const cyclesClosingSoon = cyclesAtLeastCurrent.filter(c => c <= current + 5);
            empProbWithin5 = cyclesClosingSoon.length / cyclesAtLeastCurrent.length;
          } else {
            empProbWithin5 = 0.0;
          }

          urgencyScore = sd !== 0 ? Math.max(0, (current - mu) / sd) : 0;
        }

        stats[i] = {
          mu: parseFloat(mu.toFixed(2)),
          sd: parseFloat(sd.toFixed(2)),
          currentCycle: currentCycle[i],
          historicalCycles: cycles,
          empProbWithin5: parseFloat(empProbWithin5.toFixed(4)),
          urgencyScore: parseFloat(urgencyScore.toFixed(2)),
          frequency: 0, // Will be calculated below
          frequencyZScore: 0, // Will be calculated below
          weightedScore: 0 // Will be calculated below
        };
      }

      // Calculate Frequency and Weighted Score
      const totalContests = contests.length;
      const frequencies: number[] = [];

      // 1. Calculate raw frequencies
      for (let i = MEGASENA_CONFIG.MIN_NUMBER; i <= MEGASENA_CONFIG.MAX_NUMBER; i++) {
        if (stats[i]) {
          const appearances = stats[i].historicalCycles.length;
          const freq = totalContests > 0 ? appearances / totalContests : 0;
          stats[i].frequency = parseFloat(freq.toFixed(4));
          frequencies.push(freq);
        }
      }

      // 2. Calculate Frequency Z-Score stats
      const meanFreq = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
      const varianceFreq = frequencies.reduce((a, b) => a + Math.pow(b - meanFreq, 2), 0) / frequencies.length;
      const sdFreq = Math.sqrt(varianceFreq);

      // 3. Calculate Weighted Score
      for (let i = MEGASENA_CONFIG.MIN_NUMBER; i <= MEGASENA_CONFIG.MAX_NUMBER; i++) {
        if (stats[i]) {
          const freqZ = sdFreq !== 0 ? (stats[i].frequency - meanFreq) / sdFreq : 0;
          stats[i].frequencyZScore = parseFloat(freqZ.toFixed(2));

          // Weighted: urgency (how delayed) + frequency (how often it appears)
          const weighted = (stats[i].urgencyScore * 0.6) + (freqZ * 0.4);
          stats[i].weightedScore = parseFloat(weighted.toFixed(2));
        }
      }

      await cacheData(this.CACHE_KEY, stats, this.CACHE_TTL);
      return stats;
    });
  }

  async getFullCycleAnalysis(): Promise<{
    totalCompletedCycles: number;
    currentCycleStartContest: number;
    currentCycleDuration: number;
    longestCycle: number;
    shortestCycle: number;
    averageCycleDuration: number;
    missingNumbers: number[];
    numbersInCurrentCycle: number[];
  }> {
    return await performanceMonitor.trackOperation('getFullCycleAnalysis', async () => {
      const contests = await db.contest.findMany({
        orderBy: { concurso: 'asc' },
        select: {
          concurso: true,
          bola01: true, bola02: true, bola03: true,
          bola04: true, bola05: true, bola06: true
        }
      });

      const allCycles: number[] = [];
      let currentCycleStart = contests[0]?.concurso || 0;
      const numbersSeenInCurrentCycle = new Set<number>();
      let cycleStartContest = contests[0]?.concurso || 0;

      for (let contestIdx = 0; contestIdx < contests.length; contestIdx++) {
        const contest = contests[contestIdx];
        const numbers = [
          contest.bola01, contest.bola02, contest.bola03,
          contest.bola04, contest.bola05, contest.bola06
        ];

        numbers.forEach(num => numbersSeenInCurrentCycle.add(num));

        // Ciclo completo: todas as 60 dezenas apareceram
        if (numbersSeenInCurrentCycle.size === MEGASENA_CONFIG.TOTAL_NUMBERS) {
          const cycleDuration = contest.concurso - cycleStartContest + 1;
          allCycles.push(cycleDuration);

          // Reinicia o ciclo
          numbersSeenInCurrentCycle.clear();
          cycleStartContest = contest.concurso + 1;
        }
      }

      // Calcular estatísticas
      const totalCompletedCycles = allCycles.length;
      const longestCycle = allCycles.length > 0 ? Math.max(...allCycles) : 0;
      const shortestCycle = allCycles.length > 0 ? Math.min(...allCycles) : 0;
      const averageCycleDuration = allCycles.length > 0
        ? parseFloat((allCycles.reduce((a, b) => a + b, 0) / allCycles.length).toFixed(2))
        : 0;

      // Ciclo atual
      const lastContest = contests[contests.length - 1];
      const currentCycleDuration = lastContest ? lastContest.concurso - cycleStartContest + 1 : 0;

      // Dezenas faltantes no ciclo atual (1-60)
      const missingNumbers: number[] = [];
      for (let i = MEGASENA_CONFIG.MIN_NUMBER; i <= MEGASENA_CONFIG.MAX_NUMBER; i++) {
        if (!numbersSeenInCurrentCycle.has(i)) {
          missingNumbers.push(i);
        }
      }

      return {
        totalCompletedCycles,
        currentCycleStartContest: cycleStartContest,
        currentCycleDuration,
        longestCycle,
        shortestCycle,
        averageCycleDuration,
        missingNumbers,
        numbersInCurrentCycle: Array.from(numbersSeenInCurrentCycle).sort((a, b) => a - b),
      };
    });
  }

  async invalidateCache(): Promise<void> {
    await cacheData(this.CACHE_KEY, null, 0);
  }
}

export const cycleAnalyzer = CycleAnalyzer.getInstance();
