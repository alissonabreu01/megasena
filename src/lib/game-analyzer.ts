import { cacheData, getCachedData } from './cache';
import { performanceMonitor } from './performance';
import logger from './logger';
import { GameAnalysisSchema, type GameAnalysis } from './validators';
import { FRAME_NUMBERS, PRIME_NUMBERS, FIBONACCI_NUMBERS } from './analysis';

export class GameAnalyzer {
    private static instance: GameAnalyzer;

    private constructor() { }

    public static getInstance(): GameAnalyzer {
        if (!GameAnalyzer.instance) {
            GameAnalyzer.instance = new GameAnalyzer();
        }
        return GameAnalyzer.instance;
    }

    async analyzeGames(games: number[][]): Promise<GameAnalysis> {
        return await performanceMonitor.trackOperation('analyzeGames', async () => {
            const cacheKey = `game-analysis:${JSON.stringify(games)}`;
            const cached = await getCachedData<GameAnalysis>(cacheKey);

            if (cached) {
                logger.info('Cache hit for game analysis');
                return cached;
            }

            logger.info('Cache miss for game analysis, performing analysis');

            const analyses = await this.performAnalysis(games);
            const result = { games, analyses };

            // Validar resultado
            GameAnalysisSchema.parse(result);

            // Cache por 1 hora
            await cacheData(cacheKey, result, 3600);

            return result;
        });
    }

    private async performAnalysis(games: number[][]): Promise<string[]> {
        const analyses: string[] = [];

        for (const game of games) {
            const frameCount = game.filter(num => FRAME_NUMBERS.has(num)).length;
            const primeCount = game.filter(num => PRIME_NUMBERS.has(num)).length;
            const fiboCount = game.filter(num => FIBONACCI_NUMBERS.has(num)).length;

            const sum = game.reduce((acc, num) => acc + num, 0);
            const avg = sum / game.length;

            analyses.push(
                `Quadrante: ${frameCount}/15, ` +
                `Primos: ${primeCount}/15, ` +
                `Fibonacci: ${fiboCount}/15, ` +
                `Média: ${avg.toFixed(2)}`
            );
        }

        return analyses;
    }
}

export const gameAnalyzer = GameAnalyzer.getInstance();