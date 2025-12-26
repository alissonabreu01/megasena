import { NextResponse } from 'next/server';
import { MEGASENA_CONFIG } from '@/lib/megasena-constants';

interface FrequencyData {
    number: number;
    frequency: number;
}

export async function POST(request: Request) {
    try {
        const { contestsToAnalyze = 50 } = await request.json();

        // Busca os últimos N concursos da Mega Sena
        const response = await fetch(`https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/`, {
            next: { revalidate: 3600 } // Cache de 1 hora
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar dados da API');
        }

        const latestContest = await response.json();
        const latestNumber = latestContest.numero;

        // Busca histórico de concursos
        const frequencyMap = new Map<number, number>();

        // Inicializa todos os números com frequência 0 (1-60 para Mega Sena)
        for (let i = MEGASENA_CONFIG.MIN_NUMBER; i <= MEGASENA_CONFIG.MAX_NUMBER; i++) {
            frequencyMap.set(i, 0);
        }

        // Analisa os últimos N concursos
        const startContest = Math.max(1, latestNumber - contestsToAnalyze + 1);

        for (let contestNum = startContest; contestNum <= latestNumber; contestNum++) {
            try {
                const res = await fetch(
                    `https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${contestNum}`,
                    { next: { revalidate: 3600 } }
                );

                if (res.ok) {
                    const data = await res.json();
                    const drawnNumbers = data.listaDezenas?.map((n: string) => parseInt(n, 10)) || [];

                    drawnNumbers.forEach((num: number) => {
                        if (num >= MEGASENA_CONFIG.MIN_NUMBER && num <= MEGASENA_CONFIG.MAX_NUMBER) {
                            const current = frequencyMap.get(num) || 0;
                            frequencyMap.set(num, current + 1);
                        }
                    });
                }
            } catch (err) {
                console.error(`Erro ao buscar concurso ${contestNum}:`, err);
            }
        }

        // Converte para array e ordena por frequência
        const frequencies: FrequencyData[] = Array.from(frequencyMap.entries())
            .map(([number, frequency]) => ({ number, frequency }))
            .sort((a, b) => b.frequency - a.frequency);

        // Calcula estatísticas
        const totalFrequencies = frequencies.map(f => f.frequency);
        const avgFrequency = totalFrequencies.reduce((a, b) => a + b, 0) / totalFrequencies.length;

        // Classifica em quentes, médias e frias usando percentis
        const sortedByFreq = [...frequencies].sort((a, b) => b.frequency - a.frequency);
        const third = Math.floor(sortedByFreq.length / 3);

        const hot = sortedByFreq.slice(0, third).map(f => f.number);
        const medium = sortedByFreq.slice(third, third * 2).map(f => f.number);
        const cold = sortedByFreq.slice(third * 2).map(f => f.number);

        return NextResponse.json({
            contestsAnalyzed: contestsToAnalyze,
            latestContest: latestNumber,
            frequencies: frequencies,
            statistics: {
                average: avgFrequency,
                min: Math.min(...totalFrequencies),
                max: Math.max(...totalFrequencies),
            },
            classification: {
                hot: hot,
                medium: medium,
                cold: cold,
            }
        });

    } catch (error) {
        console.error('Erro na análise de frequência:', error);
        return NextResponse.json(
            { error: 'Erro ao analisar frequência de dezenas' },
            { status: 500 }
        );
    }
}
