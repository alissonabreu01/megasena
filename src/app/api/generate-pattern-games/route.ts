import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MEGASENA_CONFIG, FRAME_NUMBERS } from '@/lib/megasena-constants';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            numGames = 10,
            numbersPerGame = MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME, // Padrão 6
            contestsToAnalyze = 100,
        } = body;

        // Validar numbersPerGame
        if (numbersPerGame < MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME ||
            numbersPerGame > MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME) {
            return NextResponse.json(
                { error: `Números por jogo deve estar entre ${MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME} e ${MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME}` },
                { status: 400 }
            );
        }

        // Buscar últimos concursos para análise
        const contests = await db.contest.findMany({
            orderBy: { concurso: 'desc' },
            take: contestsToAnalyze,
            select: {
                concurso: true,
                bola01: true, bola02: true, bola03: true,
                bola04: true, bola05: true, bola06: true,
            }
        });

        if (contests.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum concurso encontrado para análise' },
                { status: 400 }
            );
        }

        // Analisar padrões
        const patterns = analyzePatterns(contests, numbersPerGame);

        // Gerar jogos baseados nos padrões
        const games: any[] = [];
        for (let i = 0; i < numGames; i++) {
            const game = generateGameFromPatterns(patterns, numbersPerGame);
            games.push({
                numbers: game,
                metrics: calculateMetrics(game)
            });
        }

        return NextResponse.json({
            games,
            patterns,
            message: `${numGames} jogos de ${numbersPerGame} números gerados baseados em análise de ${contestsToAnalyze} concursos`
        });

    } catch (error) {
        console.error('Error generating pattern-based games:', error);
        return NextResponse.json(
            { error: 'Erro ao gerar jogos baseados em padrões' },
            { status: 500 }
        );
    }
}

function analyzePatterns(contests: any[], numbersPerGame: number) {
    const evenOddCounts: number[] = [];
    const frameCounts: number[] = [];
    const sums: number[] = [];
    const lineDistribution: Map<number, number> = new Map();
    const columnDistribution: Map<number, number> = new Map();

    contests.forEach(contest => {
        // Mega Sena: 6 bolas por concurso
        const numbers = [
            contest.bola01, contest.bola02, contest.bola03,
            contest.bola04, contest.bola05, contest.bola06
        ].filter(n => n !== null && n !== undefined);

        // Contar pares
        const evenCount = numbers.filter(n => n % 2 === 0).length;
        evenOddCounts.push(evenCount);

        // Contar moldura
        const frameCount = numbers.filter(n => FRAME_NUMBERS.has(n)).length;
        frameCounts.push(frameCount);

        // Calcular soma
        const sum = numbers.reduce((a, b) => a + b, 0);
        sums.push(sum);

        // Distribuição por linha (grid 6x10)
        numbers.forEach(num => {
            const line = Math.floor((num - 1) / 10);
            lineDistribution.set(line, (lineDistribution.get(line) || 0) + 1);
        });

        // Distribuição por coluna
        numbers.forEach(num => {
            const col = (num - 1) % 10;
            columnDistribution.set(col, (columnDistribution.get(col) || 0) + 1);
        });
    });

    // Calcular médias e padrões mais comuns
    const avgEven = evenOddCounts.reduce((a, b) => a + b, 0) / evenOddCounts.length;
    const avgFrame = frameCounts.reduce((a, b) => a + b, 0) / frameCounts.length;
    const avgSum = sums.reduce((a, b) => a + b, 0) / sums.length;

    // Encontrar os valores mais comuns (moda)
    const evenMode = findMode(evenOddCounts);
    const frameMode = findMode(frameCounts);

    // Calcular quartis para soma (permitir variação)
    const sortedSums = [...sums].sort((a, b) => a - b);
    const sumQ1 = sortedSums[Math.floor(sortedSums.length * 0.25)];
    const sumQ3 = sortedSums[Math.floor(sortedSums.length * 0.75)];

    // Ajustar padrões para o tamanho do jogo
    const evenMin = Math.max(1, Math.floor(numbersPerGame * 0.3));
    const evenMax = Math.min(numbersPerGame - 1, Math.ceil(numbersPerGame * 0.7));

    const frameMin = Math.floor(numbersPerGame * 0.2);
    const frameMax = Math.ceil(numbersPerGame * 0.55);

    return {
        evenOdd: {
            avg: avgEven,
            mode: evenMode,
            min: evenMin,
            max: evenMax
        },
        frame: {
            avg: avgFrame,
            mode: frameMode,
            min: frameMin,
            max: frameMax
        },
        sum: {
            avg: avgSum,
            min: sumQ1,
            max: sumQ3
        }
    };
}

function findMode(arr: number[]): number {
    const counts = new Map<number, number>();
    arr.forEach(val => counts.set(val, (counts.get(val) || 0) + 1));

    let mode = arr[0];
    let maxCount = 0;

    counts.forEach((count, val) => {
        if (count > maxCount) {
            maxCount = count;
            mode = val;
        }
    });

    return mode;
}

function generateGameFromPatterns(patterns: any, numbersPerGame: number): number[] {
    const ALL_NUMBERS = Array.from(
        { length: MEGASENA_CONFIG.TOTAL_NUMBERS },
        (_, i) => i + MEGASENA_CONFIG.MIN_NUMBER
    );

    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
        attempts++;

        // Gerar jogo aleatório
        const game: number[] = [];
        const available = [...ALL_NUMBERS];

        while (game.length < numbersPerGame && available.length > 0) {
            const idx = Math.floor(Math.random() * available.length);
            game.push(available[idx]);
            available.splice(idx, 1);
        }

        game.sort((a, b) => a - b);

        // Verificar se atende aos padrões (com flexibilidade)
        const evenCount = game.filter(n => n % 2 === 0).length;
        const frameCount = game.filter(n => FRAME_NUMBERS.has(n)).length;
        const sum = game.reduce((a, b) => a + b, 0);

        const evenOk = evenCount >= patterns.evenOdd.min && evenCount <= patterns.evenOdd.max;
        const frameOk = frameCount >= patterns.frame.min && frameCount <= patterns.frame.max;
        const sumOk = sum >= patterns.sum.min && sum <= patterns.sum.max;

        if (evenOk && frameOk && sumOk) {
            return game;
        }
    }

    // Se não conseguir gerar dentro dos padrões, retorna um jogo válido qualquer
    const fallbackGame: number[] = [];
    const available = [...ALL_NUMBERS];

    while (fallbackGame.length < numbersPerGame) {
        const idx = Math.floor(Math.random() * available.length);
        fallbackGame.push(available[idx]);
        available.splice(idx, 1);
    }

    return fallbackGame.sort((a, b) => a - b);
}

function calculateMetrics(numbers: number[]) {
    const evenCount = numbers.filter(n => n % 2 === 0).length;
    const oddCount = numbers.length - evenCount;
    const frameCount = numbers.filter(n => FRAME_NUMBERS.has(n)).length;
    const coreCount = numbers.length - frameCount;
    const sum = numbers.reduce((a, b) => a + b, 0);

    return {
        evenCount,
        oddCount,
        frameCount,
        coreCount,
        sum
    };
}
