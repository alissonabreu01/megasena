import { isGameBalanced, FRAME_NUMBERS, PRIME_NUMBERS, FIBONACCI_NUMBERS } from './analysis';

const TOTAL_NUMBERS = 25;
const NUMBERS_PER_GAME = 15;

function generateRandomGame(): number[] {
    const numbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const game: number[] = [];
    for (let i = 0; i < NUMBERS_PER_GAME; i++) {
        const randomIndex = Math.floor(Math.random() * numbers.length);
        game.push(numbers.splice(randomIndex, 1)[0]);
    }
    return game.sort((a, b) => a - b);
}

export function runMonteCarloSimulation(simulations: number, lastContestNumbers: Set<number>) {
    let balancedGames = 0;
    const frameCountDistribution = new Map<number, number>();
    const primeCountDistribution = new Map<number, number>();
    const fiboCountDistribution = new Map<number, number>();
    const sumDistribution = new Map<number, number>();


    for (let i = 0; i < simulations; i++) {
        const game = generateRandomGame();
        if (isGameBalanced(game, lastContestNumbers)) {
            balancedGames++;
        }

        const frameCount = game.filter(num => FRAME_NUMBERS.has(num)).length;
        const primeCount = game.filter(num => PRIME_NUMBERS.has(num)).length;
        const fiboCount = game.filter(num => FIBONACCI_NUMBERS.has(num)).length;
        const sum = game.reduce((acc, num) => acc + num, 0);

        frameCountDistribution.set(frameCount, (frameCountDistribution.get(frameCount) || 0) + 1);
        primeCountDistribution.set(primeCount, (primeCountDistribution.get(primeCount) || 0) + 1);
        fiboCountDistribution.set(fiboCount, (fiboCountDistribution.get(fiboCount) || 0) + 1);
        sumDistribution.set(sum, (sumDistribution.get(sum) || 0) + 1);
    }

    return {
        simulations,
        balancedGames,
        probabilityOfBalanced: balancedGames / simulations,
        distributions: {
            frameCount: Object.fromEntries(frameCountDistribution),
            primeCount: Object.fromEntries(primeCountDistribution),
            fiboCount: Object.fromEntries(fiboCountDistribution),
            sum: Object.fromEntries(sumDistribution),
        }
    };
}
