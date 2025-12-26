import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cycleAnalyzer } from './cycle-analyzer';
import { cooccurrenceAnalyzer } from './cooccurrence-analyzer';
import { db } from './db';

// Mock dependencies
vi.mock('./db', () => ({
    db: {
        contest: {
            findMany: vi.fn(),
        },
    },
}));

vi.mock('./cache', () => ({
    cacheData: vi.fn(),
    getCachedData: vi.fn().mockResolvedValue(null),
}));

vi.mock('./logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));

describe('CycleAnalyzer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate cycle stats correctly', async () => {
        // Mock data: 2 contests
        // Contest 1: 1, 2, ..., 15
        // Contest 2: 1, 2, ..., 15
        // Number 1 appears in both -> cycle 1
        // Number 25 never appears -> cycle current 2
        const mockContests = [
            { concurso: 1, bola01: 1, bola02: 2, bola03: 3, bola04: 4, bola05: 5, bola06: 6, bola07: 7, bola08: 8, bola09: 9, bola10: 10, bola11: 11, bola12: 12, bola13: 13, bola14: 14, bola15: 15 },
            { concurso: 2, bola01: 1, bola02: 2, bola03: 3, bola04: 4, bola05: 5, bola06: 6, bola07: 7, bola08: 8, bola09: 9, bola10: 10, bola11: 11, bola12: 12, bola13: 13, bola14: 14, bola15: 15 },
        ];

        (db.contest.findMany as any).mockResolvedValue(mockContests);

        const stats = await cycleAnalyzer.getCycleStats();

        // Number 1: appeared in 1 and 2. Last seen 2.
        // Cycle: 2 - 1 = 1.
        expect(stats[1].historicalCycles).toEqual([1]);
        expect(stats[1].currentCycle).toBe(0);

        // Number 25: never appeared.
        expect(stats[25].currentCycle).toBe(2);
        expect(stats[25].historicalCycles).toEqual([]);
    });
});

describe('CooccurrenceAnalyzer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate cooccurrence matrix correctly', async () => {
        // Mock data: 2 contests
        // Contest 1: 1, 2
        // Contest 2: 1, 3
        const mockContests = [
            { concurso: 1, bola01: 1, bola02: 2, bola03: 0, bola04: 0, bola05: 0, bola06: 0, bola07: 0, bola08: 0, bola09: 0, bola10: 0, bola11: 0, bola12: 0, bola13: 0, bola14: 0, bola15: 0 },
            { concurso: 2, bola01: 1, bola02: 3, bola03: 0, bola04: 0, bola05: 0, bola06: 0, bola07: 0, bola08: 0, bola09: 0, bola10: 0, bola11: 0, bola12: 0, bola13: 0, bola14: 0, bola15: 0 },
        ];

        (db.contest.findMany as any).mockResolvedValue(mockContests);

        const stats = await cooccurrenceAnalyzer.getStats();

        // 1 and 2 appeared together once
        expect(stats.matrix[1][2]).toBe(1);
        expect(stats.matrix[2][1]).toBe(1);

        // 1 and 3 appeared together once
        expect(stats.matrix[1][3]).toBe(1);

        // 2 and 3 never appeared together
        expect(stats.matrix[2][3]).toBe(0);

        // Frequency
        expect(stats.frequency[1]).toBe(2);
        expect(stats.frequency[2]).toBe(1);
        expect(stats.frequency[3]).toBe(1);
    });
});
