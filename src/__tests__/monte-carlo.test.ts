import { describe, it, expect } from 'vitest';
import { runMonteCarloSimulation } from '../lib/monte-carlo';

describe('Monte Carlo Simulation', () => {
    it('should run the simulation and return results', () => {
        const lastContestNumbers = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        const results = runMonteCarloSimulation(1000, lastContestNumbers);

        expect(results.simulations).toBe(1000);
        expect(results.balancedGames).toBeGreaterThanOrEqual(0);
        expect(results.probabilityOfBalanced).toBeGreaterThanOrEqual(0);
        expect(results.probabilityOfBalanced).toBeLessThanOrEqual(1);

        expect(results.distributions.frameCount).toBeDefined();
        expect(results.distributions.primeCount).toBeDefined();
        expect(results.distributions.fiboCount).toBeDefined();
        expect(results.distributions.sum).toBeDefined();
    });
});
