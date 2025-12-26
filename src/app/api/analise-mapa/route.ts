import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MEGASENA_CONFIG } from '@/lib/megasena-constants';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const contestsToAnalyze = parseInt(searchParams.get('contests') || '100');

        // Buscar últimos N concursos
        const contests = await db.contest.findMany({
            orderBy: { concurso: 'desc' },
            take: contestsToAnalyze
        });

        if (contests.length === 0) {
            return NextResponse.json({ error: 'Nenhum concurso encontrado' }, { status: 404 });
        }

        // Extrair números de cada concurso (Mega Sena: 6 números por concurso)
        const contestsData = contests.map(c => ({
            concurso: c.concurso,
            numbers: [
                c.bola01, c.bola02, c.bola03,
                c.bola04, c.bola05, c.bola06
            ].map(n => Number(n)).filter(n => !isNaN(n) && n > 0)
        }));

        // Análise por dezena (1-60 para Mega Sena)
        const dezenaAnalysis: {
            [key: number]: {
                number: number;
                frequency: number;
                frequencyPercent: number;
                delay: number;
                lastContest: number;
                avgDelay: number;
                maxDelay: number;
                trend: 'hot' | 'cold' | 'neutral';
                appearancePositions: number[];
            }
        } = {};

        // Inicializar análise para cada dezena (1-60 para Mega Sena)
        for (let num = MEGASENA_CONFIG.MIN_NUMBER; num <= MEGASENA_CONFIG.MAX_NUMBER; num++) {
            dezenaAnalysis[num] = {
                number: num,
                frequency: 0,
                frequencyPercent: 0,
                delay: 0,
                lastContest: 0,
                avgDelay: 0,
                maxDelay: 0,
                trend: 'neutral',
                appearancePositions: []
            };
        }

        // Calcular frequência e posições de aparição
        contestsData.forEach((contest, idx) => {
            contest.numbers.forEach(num => {
                if (dezenaAnalysis[num]) {
                    dezenaAnalysis[num].frequency++;
                    dezenaAnalysis[num].appearancePositions.push(idx);
                    if (dezenaAnalysis[num].lastContest === 0) {
                        dezenaAnalysis[num].lastContest = contest.concurso;
                    }
                }
            });
        });

        // Calcular atraso e estatísticas
        const latestContest = contestsData[0];
        const latestNumbers = new Set(latestContest.numbers);

        for (let num = MEGASENA_CONFIG.MIN_NUMBER; num <= MEGASENA_CONFIG.MAX_NUMBER; num++) {
            const analysis = dezenaAnalysis[num];
            const positions = analysis.appearancePositions;

            // Frequência percentual
            analysis.frequencyPercent = (analysis.frequency / contestsData.length) * 100;

            // Atraso atual (quantos concursos desde a última aparição)
            if (positions.length > 0) {
                analysis.delay = positions[0];
            } else {
                analysis.delay = contestsData.length;
            }

            // Calcular atrasos entre aparições
            if (positions.length > 1) {
                const delays: number[] = [];
                for (let i = 0; i < positions.length - 1; i++) {
                    delays.push(positions[i + 1] - positions[i]);
                }
                analysis.avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
                analysis.maxDelay = Math.max(...delays);
            } else if (positions.length === 1) {
                analysis.avgDelay = positions[0];
                analysis.maxDelay = positions[0];
            }

            // Tendência: "quente" se saiu recentemente com frequência alta, "frio" se atrasado
            // Mega Sena: 60 dezenas, 6 sorteadas -> cada número sai a cada ~10 concursos em média
            const expectedDelay = MEGASENA_CONFIG.TOTAL_NUMBERS / MEGASENA_CONFIG.NUMBERS_DRAWN;

            if (analysis.delay === 0 && analysis.frequencyPercent >= 12) { // ~12% é o esperado (6/60 * 100)
                analysis.trend = 'hot';
            } else if (analysis.delay > expectedDelay * 1.5 || analysis.delay > 15) {
                analysis.trend = 'cold';
            } else if (analysis.delay <= 2 && analysis.frequencyPercent >= 10) {
                analysis.trend = 'hot';
            } else {
                analysis.trend = 'neutral';
            }
        }

        // Ordenar por diferentes critérios
        const byDelay = Object.values(dezenaAnalysis).sort((a, b) => b.delay - a.delay);
        const byFrequency = Object.values(dezenaAnalysis).sort((a, b) => b.frequency - a.frequency);
        const hotNumbers = Object.values(dezenaAnalysis).filter(d => d.trend === 'hot').map(d => d.number);
        const coldNumbers = Object.values(dezenaAnalysis).filter(d => d.trend === 'cold').map(d => d.number);

        // Dezenas que mais atrasaram (candidatas a sair)
        const overdue = byDelay.filter(d => d.delay > d.avgDelay).slice(0, 10);

        // Dezenas mais frequentes
        const mostFrequent = byFrequency.slice(0, 10);

        // Sugestão de dezenas para próximo jogo
        // Para jogos de 6 a 15 números, sugerir um bom conjunto
        const suggestedNumbers = new Set<number>();

        // Estratégia balanceada:
        // - 40% atrasadas (dezenas que estão devendo sair)
        // - 30% frequentes (dezenas que saem mais)
        // - 30% quentes (dezenas em tendência)

        overdue.slice(0, 8).forEach(d => suggestedNumbers.add(d.number));
        mostFrequent.slice(0, 6).forEach(d => suggestedNumbers.add(d.number));
        hotNumbers.slice(0, 6).forEach(n => suggestedNumbers.add(n));

        const suggestedArray = Array.from(suggestedNumbers);

        // Se ainda não tiver pelo menos 15 números, completar com as mais frequentes
        if (suggestedArray.length < 15) {
            for (const d of byFrequency) {
                if (!suggestedNumbers.has(d.number)) {
                    suggestedArray.push(d.number);
                    if (suggestedArray.length >= 20) break;
                }
            }
        }

        // Análise de padrões recentes (últimos 10 concursos)
        const recentContests = contestsData.slice(0, 10);
        const recentFrequency: { [key: number]: number } = {};

        for (let num = MEGASENA_CONFIG.MIN_NUMBER; num <= MEGASENA_CONFIG.MAX_NUMBER; num++) {
            recentFrequency[num] = 0;
        }

        recentContests.forEach(c => {
            c.numbers.forEach(n => {
                if (recentFrequency[n] !== undefined) {
                    recentFrequency[n]++;
                }
            });
        });

        const recentHot = Object.entries(recentFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }));

        const recentCold = Object.entries(recentFrequency)
            .sort(([, a], [, b]) => a - b)
            .slice(0, 10)
            .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }));

        return NextResponse.json({
            contestsAnalyzed: contestsData.length,
            latestContest: latestContest.concurso,
            dezenas: Object.values(dezenaAnalysis),
            overdue,
            mostFrequent,
            hotNumbers,
            coldNumbers,
            suggestedNumbers: suggestedArray.sort((a, b) => a - b),
            recentAnalysis: {
                contests: 10,
                hot: recentHot,
                cold: recentCold
            }
        });

    } catch (error) {
        console.error('Error in map analysis:', error);
        return NextResponse.json(
            { error: 'Erro ao analisar o mapa de dezenas' },
            { status: 500 }
        );
    }
}
