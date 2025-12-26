import { NextResponse } from 'next/server';
import { getQuadrantsForNumbers } from '@/lib/megasena-constants';

interface QuadrantAnalysis {
    quadrant: number;
    frequency: number;
    percentage: number;
    numbersDrawn: number[];
}

interface QuadrantClassification {
    hot: number[];
    medium: number[];
    cold: number[];
}

interface ContestData {
    concurso: number;
    data: string;
    dezenas: string[];
}

/**
 * API para analisar a frequência de quadrantes nos últimos concursos da Mega Sena
 */
export async function POST(request: Request) {
    try {
        const { contestsToAnalyze = 50 } = await request.json();

        // Busca os resultados dos últimos concursos da Mega Sena
        const response = await fetch('https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/');

        if (!response.ok) {
            throw new Error('Erro ao buscar dados da API');
        }

        const latestContest = await response.json();
        const latestNumber = latestContest.numero;

        // Busca histórico de concursos
        const contests: ContestData[] = [];
        for (let i = 0; i < contestsToAnalyze && latestNumber - i > 0; i++) {
            try {
                const contestResponse = await fetch(
                    `https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${latestNumber - i}`,
                    { next: { revalidate: 3600 } }
                );

                if (contestResponse.ok) {
                    const contestData = await contestResponse.json();
                    contests.push({
                        concurso: contestData.numero,
                        data: contestData.dataApuracao,
                        dezenas: contestData.listaDezenas || []
                    });
                }
            } catch (err) {
                console.error(`Erro ao buscar concurso ${latestNumber - i}:`, err);
            }
        }

        // Analisa frequência por quadrante
        const quadrantFrequency: { [key: number]: Set<number> } = {
            1: new Set(),
            2: new Set(),
            3: new Set(),
            4: new Set(),
        };

        contests.forEach(contest => {
            if (contest.dezenas) {
                contest.dezenas.forEach((dezena: string) => {
                    const num = parseInt(dezena);
                    const quadrant = getNumberQuadrant(num);
                    quadrantFrequency[quadrant].add(num);
                });
            }
        });

        // Calcula estatísticas por quadrante
        // Mega Sena: 6 dezenas por concurso
        const totalDraws = contests.length * 6;
        const analysis: QuadrantAnalysis[] = [1, 2, 3, 4].map(q => {
            const count = contests.reduce((acc, contest) => {
                if (contest.dezenas) {
                    return acc + contest.dezenas.filter((d: string) => {
                        const num = parseInt(d);
                        return getNumberQuadrant(num) === q;
                    }).length;
                }
                return acc;
            }, 0);

            return {
                quadrant: q,
                frequency: count,
                percentage: (count / totalDraws) * 100,
                numbersDrawn: Array.from(quadrantFrequency[q]).sort((a, b) => a - b),
            };
        });

        // Ordena por frequência
        analysis.sort((a, b) => b.frequency - a.frequency);

        // Classifica quadrantes em quentes, médios e frios
        const classification: QuadrantClassification = {
            hot: [analysis[0].quadrant],
            medium: [analysis[1].quadrant, analysis[2].quadrant],
            cold: [analysis[3].quadrant],
        };

        return NextResponse.json({
            success: true,
            contestsAnalyzed: contests.length,
            analysis,
            classification,
            summary: {
                totalDraws,
                expectedPerQuadrant: totalDraws / 4,
            },
        });
    } catch (error) {
        console.error('Erro ao analisar quadrantes:', error);
        return NextResponse.json(
            { error: 'Erro ao analisar quadrantes' },
            { status: 500 }
        );
    }
}

/**
 * Determina o quadrante de um número na Mega Sena (grid 6x10)
 * Q1: 1-15 (linhas 1-2, colunas 1-5)
 * Q2: 16-30 (linhas 2-3, colunas 6-10)
 * Q3: 31-45 (linhas 4-5, colunas 1-5)
 * Q4: 46-60 (linhas 5-6, colunas 6-10)
 */
function getNumberQuadrant(num: number): number {
    // Mega Sena: números de 1 a 60
    if (num >= 1 && num <= 15) return 1;
    if (num >= 16 && num <= 30) return 2;
    if (num >= 31 && num <= 45) return 3;
    if (num >= 46 && num <= 60) return 4;

    return 1; // fallback
}
