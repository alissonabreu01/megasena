import { db } from '@/lib/db';
import { cacheData, getCachedData } from './cache';
import { performanceMonitor } from './performance';
import logger from './logger';

export interface CooccurrenceStats {
    matrix: number[][]; // 25x25 matrix where [i][j] is the count of times i and j appeared together
    correlations: number[][]; // 25x25 matrix of Phi coefficients
    totalContests: number;
    frequency: number[]; // Frequency of each number
}

export class CooccurrenceAnalyzer {
    private static instance: CooccurrenceAnalyzer;
    private readonly CACHE_KEY = 'cooccurrence_stats_v1';
    private readonly CACHE_TTL = 86400; // 24 hours (heavy calculation, changes slowly)

    private constructor() { }

    public static getInstance(): CooccurrenceAnalyzer {
        if (!CooccurrenceAnalyzer.instance) {
            CooccurrenceAnalyzer.instance = new CooccurrenceAnalyzer();
        }
        return CooccurrenceAnalyzer.instance;
    }

    async getStats(): Promise<CooccurrenceStats> {
        return await performanceMonitor.trackOperation('getCooccurrenceStats', async () => {
            const cached = await getCachedData<CooccurrenceStats>(this.CACHE_KEY);
            if (cached) {
                logger.info('Cache hit for cooccurrence stats');
                return cached;
            }

            logger.info('Cache miss for cooccurrence stats, calculating...');

            const contests = await db.contest.findMany({
                orderBy: { concurso: 'asc' },
                select: {
                    bola01: true, bola02: true, bola03: true, bola04: true, bola05: true,
                    bola06: true, bola07: true, bola08: true, bola09: true, bola10: true,
                    bola11: true, bola12: true, bola13: true, bola14: true, bola15: true,
                }
            });

            const totalContests = contests.length;
            const matrix = Array.from({ length: 26 }, () => new Array(26).fill(0));
            const frequency = new Array(26).fill(0);

            // Calculate Cooccurrence Matrix and Frequency
            for (const contest of contests) {
                const draw = [
                    contest.bola01, contest.bola02, contest.bola03, contest.bola04, contest.bola05,
                    contest.bola06, contest.bola07, contest.bola08, contest.bola09, contest.bola10,
                    contest.bola11, contest.bola12, contest.bola13, contest.bola14, contest.bola15
                ];

                for (let i = 0; i < draw.length; i++) {
                    const num1 = draw[i];
                    frequency[num1]++;
                    for (let j = i + 1; j < draw.length; j++) {
                        const num2 = draw[j];
                        matrix[num1][num2]++;
                        matrix[num2][num1]++;
                    }
                }
            }

            // Calculate Correlations (Phi Coefficient)
            // Phi = (n11*n00 - n10*n01) / sqrt(n1* * n0* * n*1 * n*0)
            // where:
            // n11 = count(i & j) = matrix[i][j]
            // n10 = count(i & !j) = freq[i] - matrix[i][j]
            // n01 = count(!i & j) = freq[j] - matrix[i][j]
            // n00 = count(!i & !j) = total - freq[i] - freq[j] + matrix[i][j]
            // n1* = freq[i]
            // n0* = total - freq[i]
            // n*1 = freq[j]
            // n*0 = total - freq[j]

            const correlations = Array.from({ length: 26 }, () => new Array(26).fill(0));

            for (let i = 1; i <= 25; i++) {
                for (let j = 1; j <= 25; j++) {
                    if (i === j) {
                        correlations[i][j] = 1.0;
                        continue;
                    }

                    const n11 = matrix[i][j];
                    const n10 = frequency[i] - n11;
                    const n01 = frequency[j] - n11;
                    const n00 = totalContests - frequency[i] - frequency[j] + n11;

                    const n1x = frequency[i];
                    const n0x = totalContests - frequency[i];
                    const nx1 = frequency[j];
                    const nx0 = totalContests - frequency[j];

                    const numerator = (n11 * n00) - (n10 * n01);
                    const denominator = Math.sqrt(n1x * n0x * nx1 * nx0);

                    correlations[i][j] = denominator !== 0 ? parseFloat((numerator / denominator).toFixed(4)) : 0;
                }
            }

            const stats: CooccurrenceStats = {
                matrix,
                correlations,
                totalContests,
                frequency
            };

            await cacheData(this.CACHE_KEY, stats, this.CACHE_TTL);
            return stats;
        });
    }

    async invalidateCache(): Promise<void> {
        await cacheData(this.CACHE_KEY, null, 0);
    }
}

export const cooccurrenceAnalyzer = CooccurrenceAnalyzer.getInstance();
