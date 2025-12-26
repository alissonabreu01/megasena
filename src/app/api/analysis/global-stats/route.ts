import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FRAME_NUMBERS, MEGASENA_CONFIG } from '@/lib/megasena-constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const concursoCount = searchParams.get('concursoCount');

        const contests = await db.contest.findMany({
            orderBy: { concurso: 'desc' },
            take: concursoCount ? parseInt(concursoCount, 10) : undefined,
        });

        const totalContests = contests.length;
        const numbers: Record<string, number> = {};
        const evenOdd: Record<string, number> = {};
        const sum: Record<string, number> = {};
        const frame: Record<string, number> = {};
        let globalSumAccumulator = 0;

        // Initialize counters for 1-60 (Mega Sena)
        for (let i = MEGASENA_CONFIG.MIN_NUMBER; i <= MEGASENA_CONFIG.MAX_NUMBER; i++) {
            numbers[i.toString().padStart(2, '0')] = 0;
        }

        // Initialize all possible even/odd combinations (0P-6I to 6P-0I)
        // Mega Sena: 6 números sorteados
        for (let evenCount = 0; evenCount <= MEGASENA_CONFIG.NUMBERS_DRAWN; evenCount++) {
            const oddCount = MEGASENA_CONFIG.NUMBERS_DRAWN - evenCount;
            evenOdd[`${evenCount}P-${oddCount}I`] = 0;
        }

        // Initialize sum ranges para Mega Sena
        // Soma mínima: 1+2+3+4+5+6 = 21
        // Soma máxima: 55+56+57+58+59+60 = 345
        // Range: 0-400 em passos de 10
        for (let rangeStart = 0; rangeStart <= 400; rangeStart += 10) {
            sum[`${rangeStart}-${rangeStart + 9}`] = 0;
        }

        // Initialize frame counts (0 to 6 possible numbers in frame)
        for (let i = 0; i <= MEGASENA_CONFIG.NUMBERS_DRAWN; i++) {
            frame[i.toString()] = 0;
        }

        contests.forEach(contest => {
            const contestNumbers: number[] = [];
            let evenCount = 0;
            let contestSum = 0;
            let frameCount = 0;

            // Mega Sena: 6 bolas sorteadas
            for (let i = 1; i <= MEGASENA_CONFIG.NUMBERS_DRAWN; i++) {
                const num = contest[`bola${i.toString().padStart(2, '0')}` as keyof typeof contest] as number;

                if (num !== null && num !== undefined) {
                    contestNumbers.push(num);
                    numbers[num.toString().padStart(2, '0')]++;
                    if (num % 2 === 0) evenCount++;
                    contestSum += num;
                    if (FRAME_NUMBERS.includes(num)) frameCount++;
                }
            }

            globalSumAccumulator += contestSum;

            // Even/Odd distribution
            const evenOddKey = `${evenCount}P-${contestNumbers.length - evenCount}I`;
            evenOdd[evenOddKey] = (evenOdd[evenOddKey] || 0) + 1;

            // Sum distribution (ranges of 10)
            const sumRange = Math.floor(contestSum / 10) * 10;
            const sumKey = `${sumRange}-${sumRange + 9}`;
            sum[sumKey] = (sum[sumKey] || 0) + 1;

            // Frame distribution
            frame[frameCount.toString()] = (frame[frameCount.toString()] || 0) + 1;
        });

        const averageSum = totalContests > 0 ? Math.round(globalSumAccumulator / totalContests) : 0;

        return NextResponse.json({
            data: {
                totalContests,
                numbers,
                evenOdd,
                sum,
                frame,
                averageSum
            }
        });
    } catch (error) {
        console.error('Error in global-stats API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
