// Utilitários para Sistema de Exclusão de Dezenas - Mega Sena

import { MEGASENA_CONFIG, QUADRANTS, LINES, COLUMNS, PRIME_NUMBERS, FRAME_NUMBERS } from './megasena-constants';

/**
 * Retorna os números de um quadrante específico da Mega Sena
 * Q1: 1-15
 * Q2: 16-30
 * Q3: 31-45
 * Q4: 46-60
 */
export function getQuadrantNumbers(quadrant: 1 | 2 | 3 | 4): number[] {
    switch (quadrant) {
        case 1:
            return QUADRANTS.Q1;
        case 2:
            return QUADRANTS.Q2;
        case 3:
            return QUADRANTS.Q3;
        case 4:
            return QUADRANTS.Q4;
        default:
            return [];
    }
}

/**
 * Retorna os números de uma linha específica (1-6)
 * Grid 6x10 da Mega Sena:
 * Linha 1: 1-10
 * Linha 2: 11-20
 * ...
 * Linha 6: 51-60
 */
export function getLineNumbers(line: number): number[] {
    if (line < 1 || line > 6) return [];

    const lineKey = `L${line}` as keyof typeof LINES;
    return LINES[lineKey];
}

/**
 * Retorna os números de uma coluna específica (1-10)
 * Grid 6x10 da Mega Sena:
 * Coluna 1: 1, 11, 21, 31, 41, 51
 * Coluna 2: 2, 12, 22, 32, 42, 52
 * ...
 * Coluna 10: 10, 20, 30, 40, 50, 60
 */
export function getColumnNumbers(column: number): number[] {
    if (column < 1 || column > 10) return [];

    const columnKey = `C${column}` as keyof typeof COLUMNS;
    return COLUMNS[columnKey];
}

/**
 * Retorna os números gêmeos da Mega Sena (11, 22, 33, 44, 55)
 * Na Mega Sena só existem 5 números gêmeos (até 60)
 */
export function getTwinNumbers(): number[] {
    return [11, 22, 33, 44, 55];
}

/**
 * Retorna os números primos de 1 a 60
 */
export function getPrimeNumbers(): number[] {
    return PRIME_NUMBERS;
}

/**
 * Retorna apenas números pares de 1 a 60
 */
export function getEvenNumbers(): number[] {
    const evens: number[] = [];
    for (let i = MEGASENA_CONFIG.MIN_NUMBER; i <= MEGASENA_CONFIG.MAX_NUMBER; i++) {
        if (i % 2 === 0) {
            evens.push(i);
        }
    }
    return evens;
}

/**
 * Retorna apenas números ímpares de 1 a 60
 */
export function getOddNumbers(): number[] {
    const odds: number[] = [];
    for (let i = MEGASENA_CONFIG.MIN_NUMBER; i <= MEGASENA_CONFIG.MAX_NUMBER; i++) {
        if (i % 2 !== 0) {
            odds.push(i);
        }
    }
    return odds;
}

/**
 * Retorna números da moldura (borda do volante)
 */
export function getFrameNumbers(): number[] {
    return FRAME_NUMBERS;
}

/**
 * Retorna números do centro (não fazem parte da moldura)
 */
export function getCenterNumbers(): number[] {
    const allNumbers = Array.from(
        { length: MEGASENA_CONFIG.TOTAL_NUMBERS },
        (_, i) => i + MEGASENA_CONFIG.MIN_NUMBER
    );
    return allNumbers.filter(n => !FRAME_NUMBERS.includes(n));
}

/**
 * Calcula a soma de um jogo
 */
export function calculateGameSum(game: number[]): number {
    return game.reduce((sum, num) => sum + num, 0);
}

/**
 * Conta quantos números pares tem no jogo
 */
export function countEvens(game: number[]): number {
    return game.filter(num => num % 2 === 0).length;
}

/**
 * Gera um jogo aleatório respeitando exclusões e dezenas fixas
 * Para Mega Sena: 6 a 15 números (padrão: 6)
 */
export function generateGameWithExclusions(
    excludedNumbers: number[],
    fixedNumbers: number[],
    totalNumbers: number = MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME
): number[] | null {
    // Valida totalNumbers
    if (totalNumbers < MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME ||
        totalNumbers > MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME) {
        console.error(`Total de números deve estar entre ${MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME} e ${MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME}`);
        return null;
    }

    // Cria pool de números disponíveis (1-60 menos os excluídos)
    const availableNumbers = Array.from(
        { length: MEGASENA_CONFIG.TOTAL_NUMBERS },
        (_, i) => i + MEGASENA_CONFIG.MIN_NUMBER
    ).filter(num => !excludedNumbers.includes(num) && !fixedNumbers.includes(num));

    // Calcula quantos números ainda precisamos
    const numbersNeeded = totalNumbers - fixedNumbers.length;

    // Valida se é possível gerar o jogo
    if (numbersNeeded < 0) {
        console.error('Muitas dezenas fixas');
        return null;
    }

    if (availableNumbers.length < numbersNeeded) {
        console.error('Não há números suficientes disponíveis após exclusões');
        return null;
    }

    // Seleciona números aleatórios do pool disponível
    const selectedNumbers = [...fixedNumbers];
    const shuffled = [...availableNumbers].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numbersNeeded; i++) {
        selectedNumbers.push(shuffled[i]);
    }

    // Retorna ordenado
    return selectedNumbers.sort((a, b) => a - b);
}

/**
 * Valida se um jogo atende aos critérios de filtros
 */
export function validateGame(
    game: number[],
    filters: {
        minSum?: number;
        maxSum?: number;
        minEvens?: number;
        maxEvens?: number;
        excludeTwins?: boolean;
        excludePrimes?: boolean;
        minFrame?: number;
        maxFrame?: number;
    }
): boolean {
    const sum = calculateGameSum(game);
    const evens = countEvens(game);
    const frameCount = game.filter(n => FRAME_NUMBERS.includes(n)).length;

    // Valida soma
    if (filters.minSum !== undefined && sum < filters.minSum) return false;
    if (filters.maxSum !== undefined && sum > filters.maxSum) return false;

    // Valida pares
    if (filters.minEvens !== undefined && evens < filters.minEvens) return false;
    if (filters.maxEvens !== undefined && evens > filters.maxEvens) return false;

    // Valida moldura
    if (filters.minFrame !== undefined && frameCount < filters.minFrame) return false;
    if (filters.maxFrame !== undefined && frameCount > filters.maxFrame) return false;

    // Valida gêmeos
    if (filters.excludeTwins) {
        const twins = getTwinNumbers();
        if (game.some(num => twins.includes(num))) return false;
    }

    // Valida primos
    if (filters.excludePrimes) {
        const primes = getPrimeNumbers();
        if (game.some(num => primes.includes(num))) return false;
    }

    return true;
}

/**
 * Gera múltiplos jogos com exclusões e filtros
 */
export function generateMultipleGames(
    count: number,
    excludedNumbers: number[],
    fixedNumbers: number[],
    numbersPerGame: number = MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME,
    filters: {
        minSum?: number;
        maxSum?: number;
        minEvens?: number;
        maxEvens?: number;
        excludeTwins?: boolean;
        excludePrimes?: boolean;
        minFrame?: number;
        maxFrame?: number;
    } = {},
    maxAttempts: number = 10000
): number[][] {
    const games: number[][] = [];
    let attempts = 0;

    while (games.length < count && attempts < maxAttempts) {
        attempts++;

        const game = generateGameWithExclusions(excludedNumbers, fixedNumbers, numbersPerGame);

        if (game && validateGame(game, filters)) {
            // Verifica se não é duplicado
            const isDuplicate = games.some(g =>
                g.length === game.length && g.every((num, idx) => num === game[idx])
            );

            if (!isDuplicate) {
                games.push(game);
            }
        }
    }

    return games;
}
