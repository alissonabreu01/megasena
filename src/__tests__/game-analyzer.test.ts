import { describe, it, expect, vi } from 'vitest';
import { gameAnalyzer } from '../lib/game-analyzer';
import { getCachedData, cacheData } from '../lib/cache';

// Mock do cache
vi.mock('../lib/cache', () => ({
    getCachedData: vi.fn(),
    cacheData: vi.fn(),
}));

describe('GameAnalyzer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should analyze games correctly', async () => {
        const games = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        ];

        (getCachedData as jest.Mock).mockResolvedValue(null);

        const result = await gameAnalyzer.analyzeGames(games);

        expect(result.games).toEqual(games);
        expect(result.analyses).toHaveLength(1);
        expect(result.analyses[0]).toContain('Quadrante');
        expect(result.analyses[0]).toContain('Primos');
        expect(result.analyses[0]).toContain('Fibonacci');
        expect(result.analyses[0]).toContain('Média');

        expect(cacheData).toHaveBeenCalled();
    });

    it('should return cached analysis if available', async () => {
        const cachedResult = {
            games: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]],
            analyses: ['Cached analysis']
        };

        (getCachedData as jest.Mock).mockResolvedValue(cachedResult);

        const result = await gameAnalyzer.analyzeGames(cachedResult.games);

        expect(result).toEqual(cachedResult);
        expect(cacheData).not.toHaveBeenCalled();
    });
});