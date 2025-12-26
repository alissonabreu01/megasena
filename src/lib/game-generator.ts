import { CycleStats } from './cycle-analyzer';
import { countFrameNumbers } from './frame-utils';
import { MEGASENA_CONFIG } from './megasena-constants';

interface GenerateGamesOptions {
  numGames: number;
  numbersPerGame?: number; // 6 a 15 números (padrão: 6)
  topNUrgency: number; // Use top N numbers by urgency score
  filters?: {
    evenOdd?: { min?: number; max?: number }; // Quantidade de pares
    sum?: { min?: number; max?: number }; // Soma total
    frame?: { min?: number; max?: number }; // Quantidade de números na moldura
  };
  useWeightedScore?: boolean;
  weights?: { urgency: number; frequency: number };
}

export interface GeneratedGame {
  numbers: number[];
  metrics: {
    sum: number;
    evenCount: number;
    oddCount: number;
    frameCount: number;
    avgScore: number;
  };
}

export class GameGenerator {
  private static instance: GameGenerator;

  private constructor() { }

  public static getInstance(): GameGenerator {
    if (!GameGenerator.instance) {
      GameGenerator.instance = new GameGenerator();
    }
    return GameGenerator.instance;
  }

  generateGamesBasedOnCycles(
    cycleStats: CycleStats,
    options: GenerateGamesOptions
  ): GeneratedGame[] {
    const {
      numGames,
      numbersPerGame = MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME,
      topNUrgency,
      filters,
      useWeightedScore,
      weights
    } = options;

    // Validar numbersPerGame
    if (numbersPerGame < MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME ||
      numbersPerGame > MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME) {
      throw new Error(
        `numbersPerGame deve estar entre ${MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME} e ${MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME}`
      );
    }

    const generatedGames: GeneratedGame[] = [];

    // Helper to calculate score based on configuration
    const getScore = (num: number) => {
      const stats = cycleStats[num];
      if (!stats) return 0;

      if (useWeightedScore && weights) {
        return (stats.urgencyScore * weights.urgency) + (stats.frequencyZScore * weights.frequency);
      }

      return useWeightedScore ? stats.weightedScore : stats.urgencyScore;
    };

    // Pre-calculate scores for all numbers to ensure consistency
    const scores = new Map<number, number>();
    Object.keys(cycleStats).forEach(key => {
      const num = parseInt(key);
      scores.set(num, parseFloat(getScore(num).toFixed(2)));
    });

    // 1. Base pool: select top N numbers by score
    const sortedByScore = Object.keys(cycleStats)
      .map(n => parseInt(n))
      .sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0));

    const basePool = sortedByScore.slice(0, topNUrgency);

    // Fallback if basePool is too small (mínimo de 2x numbersPerGame)
    const minPoolSize = Math.max(numbersPerGame * 2, 15);
    while (basePool.length < minPoolSize) {
      const missingCount = minPoolSize - basePool.length;
      const remainingNumbers = Array.from(
        { length: MEGASENA_CONFIG.TOTAL_NUMBERS },
        (_, i) => i + MEGASENA_CONFIG.MIN_NUMBER
      ).filter(num => !basePool.includes(num));

      basePool.push(...remainingNumbers.slice(0, missingCount));
    }

    // 2. Generate games with basic filters
    let attempts = 0;
    const maxAttempts = numGames * 200; // Prevent infinite loops

    while (generatedGames.length < numGames && attempts < maxAttempts) {
      attempts++;

      // Select numbersPerGame unique numbers from the base pool using weighted random selection
      const numbers = this.weightedRandomSelect(basePool, scores, numbersPerGame);

      numbers.sort((a, b) => a - b);

      // Calculate metrics
      const evenCount = numbers.filter((num) => num % 2 === 0).length;
      const oddCount = numbersPerGame - evenCount;
      const sum = numbers.reduce((acc, num) => acc + num, 0);
      const frameCount = countFrameNumbers(numbers);

      // Calculate average score of the selected numbers
      const totalScore = numbers.reduce((acc, num) => {
        return acc + (scores.get(num) || 0);
      }, 0);
      const avgScore = parseFloat((totalScore / numbersPerGame).toFixed(2));

      // Apply filters if provided
      let passesFilters = true;

      if (filters) {
        if (filters.evenOdd) {
          if (filters.evenOdd.min !== undefined) {
            passesFilters = passesFilters && evenCount >= filters.evenOdd.min;
          }
          if (filters.evenOdd.max !== undefined) {
            passesFilters = passesFilters && evenCount <= filters.evenOdd.max;
          }
        }

        if (filters.sum) {
          if (filters.sum.min !== undefined) {
            passesFilters = passesFilters && sum >= filters.sum.min;
          }
          if (filters.sum.max !== undefined) {
            passesFilters = passesFilters && sum <= filters.sum.max;
          }
        }

        if (filters.frame) {
          if (filters.frame.min !== undefined) {
            passesFilters = passesFilters && frameCount >= filters.frame.min;
          }
          if (filters.frame.max !== undefined) {
            passesFilters = passesFilters && frameCount <= filters.frame.max;
          }
        }
      }

      if (passesFilters) {
        // Check for duplicates
        const gameStr = JSON.stringify(numbers);
        const isDuplicate = generatedGames.some(g => JSON.stringify(g.numbers) === gameStr);

        if (!isDuplicate) {
          generatedGames.push({
            numbers,
            metrics: {
              sum,
              evenCount,
              oddCount,
              frameCount,
              avgScore
            }
          });
        }
      }
    }

    return generatedGames;
  }

  /**
   * Gera jogos simples (6 números) aleatórios sem base em ciclos
   */
  generateRandomGames(numGames: number, numbersPerGame: number = 6): GeneratedGame[] {
    const games: GeneratedGame[] = [];
    const maxAttempts = numGames * 100;
    let attempts = 0;

    while (games.length < numGames && attempts < maxAttempts) {
      attempts++;

      // Gerar números aleatórios
      const numbers: number[] = [];
      while (numbers.length < numbersPerGame) {
        const num = Math.floor(Math.random() * MEGASENA_CONFIG.TOTAL_NUMBERS) + MEGASENA_CONFIG.MIN_NUMBER;
        if (!numbers.includes(num)) {
          numbers.push(num);
        }
      }

      numbers.sort((a, b) => a - b);

      // Calcular métricas
      const evenCount = numbers.filter(n => n % 2 === 0).length;
      const oddCount = numbersPerGame - evenCount;
      const sum = numbers.reduce((acc, n) => acc + n, 0);
      const frameCount = countFrameNumbers(numbers);

      // Verificar duplicatas
      const gameStr = JSON.stringify(numbers);
      const isDuplicate = games.some(g => JSON.stringify(g.numbers) === gameStr);

      if (!isDuplicate) {
        games.push({
          numbers,
          metrics: {
            sum,
            evenCount,
            oddCount,
            frameCount,
            avgScore: 0 // Não tem score em jogos aleatórios
          }
        });
      }
    }

    return games;
  }

  private weightedRandomSelect(pool: number[], scores: Map<number, number>, count: number): number[] {
    const selected: number[] = [];
    const poolCopy = [...pool];

    for (let i = 0; i < count; i++) {
      if (poolCopy.length === 0) break;

      // Calculate total weight
      let totalWeight = 0;
      const weights = poolCopy.map(num => {
        const score = scores.get(num) || 0;
        // Ensure minimum weight (epsilon) so 0-score numbers can still be picked
        // Use a slightly larger epsilon to give "cold" numbers a fighting chance if they are in the pool
        const weight = Math.max(score, 0.1);
        totalWeight += weight;
        return weight;
      });

      let random = Math.random() * totalWeight;
      let selectedIndex = -1;

      for (let j = 0; j < weights.length; j++) {
        random -= weights[j];
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }

      // Fallback for floating point errors
      if (selectedIndex === -1) selectedIndex = weights.length - 1;

      selected.push(poolCopy[selectedIndex]);
      poolCopy.splice(selectedIndex, 1);
    }

    return selected;
  }
}

export const gameGenerator = GameGenerator.getInstance();
