import { describe, it, expect, vi } from 'vitest';
import { gameGenerator } from './game-generator';
import { CycleStats } from './cycle-analyzer';

describe('GameGenerator', () => {
    it('should prioritize numbers with higher urgency score', () => {
        // Mock cycle stats
        // Number 1 has high urgency (10.0)
        // Number 2 has low urgency (0.1)
        // Others have 0
        const mockCycleStats: CycleStats = {};
        for (let i = 1; i <= 25; i++) {
            mockCycleStats[i] = {
                mu: 0,
                sd: 0,
                currentCycle: 0,
                historicalCycles: [],
                empProbWithin5: 0,
                urgencyScore: i === 1 ? 10.0 : (i === 2 ? 0.1 : 0.0)
            };
        }

        const options = {
            numGames: 1000,
            topNUrgency: 25, // Use all numbers in pool
            filters: {
                minEven: 0,
                maxEven: 15,
                minSum: 0,
                maxSum: 1000
            }
        };

        const games = gameGenerator.generateGamesBasedOnCycles(mockCycleStats, options);

        // Count occurrences
        let count1 = 0;
        let count2 = 0;
        let count3 = 0;

        games.forEach(game => {
            if (game.includes(1)) count1++;
            if (game.includes(2)) count2++;
            if (game.includes(3)) count3++;
        });

        console.log(`Count 1 (High Urgency): ${count1}`);
        console.log(`Count 2 (Low Urgency): ${count2}`);
        console.log(`Count 3 (Zero Urgency): ${count3}`);

        // Expect number 1 to appear significantly more often than number 2 or 3
        expect(count1).toBeGreaterThan(count2);
        expect(count1).toBeGreaterThan(count3);
    });
});
