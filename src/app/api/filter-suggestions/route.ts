import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FRAME_NUMBERS } from '@/lib/megasena-constants';

export const revalidate = 0;

// API adaptada para Mega Sena (6 bolas)

interface FilterSuggestions {
    contestsAnalyzed: number;
    evenOdd: {
        min: number;
        max: number;
        average: number;
        mostCommon: number;
    };
    sum: {
        min: number;
        max: number;
        average: number;
    };
    frame: {
        min: number;
        max: number;
        average: number;
        mostCommon: number;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { contestsToAnalyze = 100 } = body;

        // Validar parâmetros
        if (contestsToAnalyze < 10 || contestsToAnalyze > 500) {
            return NextResponse.json(
                { error: 'contestsToAnalyze deve estar entre 10 e 500' },
                { status: 400 }
            );
        }

        // Buscar últimos N concursos
        const contests = await db.contest.findMany({
            orderBy: { concurso: 'desc' },
            take: contestsToAnalyze
        });

        if (contests.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum concurso encontrado no banco de dados' },
                { status: 404 }
            );
        }

        // Arrays para armazenar métricas
        const evenCounts: number[] = [];
        const sums: number[] = [];
        const frameCounts: number[] = [];

        // Analisar cada concurso (Mega Sena: 6 bolas)
        for (const contest of contests) {
            const numbers = [
                contest.bola01, contest.bola02, contest.bola03,
                contest.bola04, contest.bola05, contest.bola06
            ].filter(n => n !== null && n !== undefined);

            // Calcular pares
            const evenCount = numbers.filter(n => n % 2 === 0).length;
            evenCounts.push(evenCount);

            // Calcular soma
            const sum = numbers.reduce((a, b) => a + b, 0);
            sums.push(sum);

            // Calcular moldura
            const frameCount = numbers.filter(n => FRAME_NUMBERS.includes(n)).length;
            frameCounts.push(frameCount);
        }

        // Calcular estatísticas (valores diretos da Mega Sena)
        const analysis: FilterSuggestions = {
            contestsAnalyzed: contests.length,
            evenOdd: calculateStats(evenCounts),
            sum: calculateStats(sums),
            frame: calculateStats(frameCounts)
        };

        return NextResponse.json({ analysis });
    } catch (error) {
        console.error('Error in filter suggestions:', error);
        return NextResponse.json(
            { error: 'Erro ao analisar concursos' },
            { status: 500 }
        );
    }
}

function calculateStats(values: number[]): { min: number; max: number; average: number; mostCommon: number } {
    if (values.length === 0) {
        return { min: 0, max: 0, average: 0, mostCommon: 0 };
    }

    // Ordenar valores
    const sorted = [...values].sort((a, b) => a - b);

    // Calcular percentis 10 e 90 para ranges mais realistas
    const p10Index = Math.floor(sorted.length * 0.10);
    const p90Index = Math.floor(sorted.length * 0.90);

    const min = sorted[p10Index];
    const max = sorted[p90Index];

    // Calcular média
    const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    // Calcular moda (valor mais comum)
    const frequency: { [key: number]: number } = {};
    values.forEach(val => {
        frequency[val] = (frequency[val] || 0) + 1;
    });

    const mostCommon = parseInt(
        Object.entries(frequency).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
    );

    return {
        min: Math.round(min),
        max: Math.round(max),
        average: Math.round(average),
        mostCommon: Math.round(mostCommon)
    };
}
