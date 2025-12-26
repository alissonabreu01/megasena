/**
 * Cálculo de Score de Qualidade para Mega Sena
 * Adaptado para jogos de 6 a 15 números (range: 1-60)
 */

import { PRIME_NUMBERS, FRAME_NUMBERS, MEGASENA_CONFIG } from './megasena-constants';

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55]; // Fibonacci até 60

export interface QualityScoreResult {
    score: number;
    violations: string[];
    metrics: {
        evenCount: number;
        oddCount: number;
        frameCount: number;
        centerCount: number;
        sum: number;
        sequences: string[];
        primesCount: number;
        fibonacciCount: number;
        lines: number[]; // Count per line (6 linhas para Mega Sena)
        columns: number[]; // Count per column (10 colunas)
        amplitude: number;
        repeatedCount?: number;
        consecutivePairs: number;
        consecutiveTrios: number;
    };
}

export function calculateQualityScore(game: number[]): QualityScoreResult {
    let score = 100;
    const violations: string[] = [];
    const sortedGame = [...game].sort((a, b) => a - b);
    const gameSize = sortedGame.length; // 6 a 15 números

    // 1. Sequências (Visualização agrupada)
    const sequences: string[] = [];
    let seqStart = sortedGame[0];
    let seqLen = 1;
    let maxSeq = 1;

    for (let i = 1; i <= sortedGame.length; i++) {
        if (i < sortedGame.length && sortedGame[i] === sortedGame[i - 1] + 1) {
            seqLen++;
        } else {
            if (seqLen >= 2) {
                sequences.push(`${seqStart}-${sortedGame[i - 1]}`);
            }
            maxSeq = Math.max(maxSeq, seqLen);
            if (i < sortedGame.length) {
                seqStart = sortedGame[i];
                seqLen = 1;
            }
        }
    }

    // Penalizar sequências muito longas (ajustado para Mega Sena)
    // Para 6 números, sequência de 4+ é ruim
    const maxAcceptableSeq = Math.min(gameSize - 2, 5);
    if (maxSeq >= maxAcceptableSeq) {
        score -= 25;
        violations.push(`Sequência muito longa (${maxSeq} números)`);
    }

    // 1.1 Pares e Trios Consecutivos (Contagem estrita)
    let consecutivePairs = 0;
    let consecutiveTrios = 0;

    for (let i = 0; i < sortedGame.length - 1; i++) {
        if (sortedGame[i + 1] === sortedGame[i] + 1) {
            consecutivePairs++;
            if (i < sortedGame.length - 2 && sortedGame[i + 2] === sortedGame[i] + 2) {
                consecutiveTrios++;
            }
        }
    }

    // 2. Pares e ímpares (ajustado dinamicamente)
    const evenCount = sortedGame.filter(n => n % 2 === 0).length;
    const oddCount = gameSize - evenCount;

    // Para 6 números: ideal 2-4 pares (33%-67%)
    // Proporções ideais baseadas no tamanho do jogo
    const idealMinPct = 0.30;
    const idealMaxPct = 0.70;
    const idealMin = Math.floor(gameSize * idealMinPct);
    const idealMax = Math.ceil(gameSize * idealMaxPct);

    if (evenCount < idealMin || evenCount > idealMax) {
        score -= 20;
        violations.push(
            `Desequilíbrio Par/Ímpar (${evenCount} pares de ${gameSize}, ideal: ${idealMin}-${idealMax})`
        );
    }

    // 3. Soma das dezenas (ajustada dinamicamente)
    const sum = sortedGame.reduce((a, b) => a + b, 0);

    // Para 6 números: típico 90-240
    // Para mais números, ajustar proporcionalmente
    const avgNumberValue = 30.5; // Média de 1-60
    const idealSumMin = Math.floor(gameSize * (avgNumberValue * 0.50)); // 50% da média
    const idealSumMax = Math.ceil(gameSize * (avgNumberValue * 1.30));  // 130% da média

    if (sum < idealSumMin || sum > idealSumMax) {
        score -= 20;
        violations.push(
            `Soma fora do padrão (${sum}, ideal: ${idealSumMin}-${idealSumMax} para ${gameSize} números)`
        );
    }

    // 4. Moldura e Centro (grid 6x10 da Mega Sena)
    const frameCount = sortedGame.filter(n => FRAME_NUMBERS.includes(n)).length;
    const centerCount = gameSize - frameCount;

    // Para 6 números: ideal ~2 da moldura (25%-50%)
    // 28 números na moldura de 60 total = 46.7%
    const idealFrameMinPct = 0.20;
    const idealFrameMaxPct = 0.55;
    const idealFrameMin = Math.floor(gameSize * idealFrameMinPct);
    const idealFrameMax = Math.ceil(gameSize * idealFrameMaxPct);

    if (frameCount < idealFrameMin || frameCount > idealFrameMax) {
        score -= 15;
        violations.push(
            `Moldura fora do padrão (${frameCount} de ${gameSize}, ideal: ${idealFrameMin}-${idealFrameMax})`
        );
    }

    // 5. Primos (17 primos até 60)
    const primesCount = sortedGame.filter(n => PRIME_NUMBERS.includes(n)).length;

    // 17 primos de 60 total = 28.3%
    // Para 6 números: ideal ~1-2 primos
    const idealPrimesMinPct = 0.15;
    const idealPrimesMaxPct = 0.45;
    const idealPrimesMin = Math.floor(gameSize * idealPrimesMinPct);
    const idealPrimesMax = Math.ceil(gameSize * idealPrimesMaxPct);

    if (primesCount < idealPrimesMin || primesCount > idealPrimesMax) {
        score -= 12;
        violations.push(
            `Primos fora do padrão (${primesCount} de ${gameSize}, ideal: ${idealPrimesMin}-${idealPrimesMax})`
        );
    }

    // 6. Fibonacci (9 Fibonacci até 60)
    const fibCount = sortedGame.filter(n => FIBONACCI.includes(n)).length;

    // 9 Fibonacci de 60 total = 15%
    // Para 6 números: ideal 0-2
    const idealFibMin = 0;
    const idealFibMax = Math.ceil(gameSize * 0.30);

    if (fibCount > idealFibMax) {
        score -= 8;
        violations.push(
            `Fibonacci em excesso (${fibCount} de ${gameSize}, máximo ideal: ${idealFibMax})`
        );
    }

    // 7. Linhas e Colunas (grid 6x10 da Mega Sena)
    const lines = Array(6).fill(0);
    const columns = Array(10).fill(0);

    sortedGame.forEach(n => {
        // Linhas: números 1-10 = linha 0, 11-20 = linha 1, etc.
        const lineIndex = Math.floor((n - 1) / 10);
        // Colunas: 1,11,21,31,41,51 = coluna 0; 2,12,22... = coluna 1, etc.
        const colIndex = ((n - 1) % 10);

        if (lineIndex >= 0 && lineIndex < 6) lines[lineIndex]++;
        if (colIndex >= 0 && colIndex < 10) columns[colIndex]++;
    });

    // Penalidade para linhas/colunas vazias ou cheias demais
    // Para 6 números, espera-se boa distribuição
    const maxPerLine = Math.min(gameSize, 3); // No máximo 3 por linha
    const fullLines = lines.filter(c => c > maxPerLine).length;

    if (fullLines >= 1) {
        score -= 8;
        violations.push('Distribuição de linhas desequilibrada');
    }

    const maxPerColumn = Math.min(gameSize, 2); // No máximo 2 por coluna
    const fullColumns = columns.filter(c => c > maxPerColumn).length;

    if (fullColumns >= 2) {
        score -= 8;
        violations.push('Distribuição de colunas/terminações desequilibrada');
    }

    // 8. Amplitude (para números de 1-60)
    const amplitude = sortedGame[sortedGame.length - 1] - sortedGame[0];

    // Para 6 números: amplitude mínima ~20-25 (1/3 do range)
    const minAmplitude = Math.floor(MEGASENA_CONFIG.TOTAL_NUMBERS * 0.35);

    if (amplitude < minAmplitude) {
        score -= 10;
        violations.push(
            `Amplitude muito baixa (${amplitude}, ideal: >${minAmplitude})`
        );
    }

    return {
        score: Math.max(0, score),
        violations,
        metrics: {
            evenCount,
            oddCount,
            frameCount,
            centerCount,
            sum,
            sequences,
            primesCount,
            fibonacciCount: fibCount,
            lines,
            columns,
            amplitude,
            consecutivePairs,
            consecutiveTrios
        }
    };
}
