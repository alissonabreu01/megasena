import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gerarFechamento, verificarAcertos, FechamentoConfig } from '@/lib/fechamento-utils';

/**
 * Interface para requisição da simulação
 */
interface SimulationRequest {
    availableNumbers: number[];
    fixedNumbers?: number[];
    guaranteedHits: number;
    algorithm: 'balanceado' | 'cobertura' | 'otimizado';
    maxGames?: number;
    contestRange?: {
        start: number;
        end: number;
    };
    lastN?: number;
}

/**
 * Interface para resultado de um concurso testado
 */
interface ContestResult {
    contestNumber: number;
    drawnNumbers: number[];
    bestHits: number;
    worstHits: number;
    averageHits: number;
    guaranteeAchieved: boolean;
}

/**
 * Interface para sumário da simulação
 */
interface SimulationSummary {
    totalContestsTested: number;
    guaranteeSuccessRate: number;
    averageBestHits: number;
    averageWorstHits: number;
    distribution: { [hits: number]: number };
}

export async function POST(request: Request) {
    try {
        const body: SimulationRequest = await request.json();

        // Validações
        if (!body.availableNumbers || body.availableNumbers.length < 15) {
            return NextResponse.json(
                { error: 'É necessário fornecer pelo menos 15 dezenas disponíveis.' },
                { status: 400 }
            );
        }

        if (body.guaranteedHits < 15 || body.guaranteedHits > 20) {
            return NextResponse.json(
                { error: 'A garantia deve estar entre 15 e 20 acertos.' },
                { status: 400 }
            );
        }

        // Configuração do fechamento
        const config: FechamentoConfig = {
            availableNumbers: body.availableNumbers,
            fixedNumbers: body.fixedNumbers || [],
            guaranteedHits: body.guaranteedHits,
            maxGames: body.maxGames || 100,
        };

        // Gerar fechamento
        const closingResult = gerarFechamento(config, body.algorithm);
        const closingGames = closingResult.games;

        // Buscar concursos históricos
        let contests;
        if (body.lastN) {
            contests = await db.contest.findMany({
                orderBy: { concurso: 'desc' },
                take: body.lastN,
            });
        } else if (body.contestRange) {
            contests = await db.contest.findMany({
                where: {
                    concurso: {
                        gte: body.contestRange.start,
                        lte: body.contestRange.end,
                    },
                },
                orderBy: { concurso: 'asc' },
            });
        } else {
            // Padrão: últimos 50 concursos
            contests = await db.contest.findMany({
                orderBy: { concurso: 'desc' },
                take: 50,
            });
        }

        if (contests.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum concurso encontrado no range especificado.' },
                { status: 404 }
            );
        }

        // Testar fechamento contra cada concurso
        const results: ContestResult[] = [];
        let totalSuccesses = 0;
        let totalBestHits = 0;
        let totalWorstHits = 0;
        const distribution: { [hits: number]: number } = {};

        for (const contest of contests) {
            // Extrair dezenas sorteadas
            const drawnNumbers: number[] = [];
            for (let i = 1; i <= 20; i++) {
                const key = `bola${i.toString().padStart(2, '0')}` as keyof typeof contest;
                drawnNumbers.push(contest[key] as number);
            }

            // Verificar acertos
            const verification = verificarAcertos(
                closingGames,
                drawnNumbers,
                body.guaranteedHits
            );

            // Guardar resultado
            results.push({
                contestNumber: contest.concurso,
                drawnNumbers,
                bestHits: verification.best,
                worstHits: verification.worst,
                averageHits: verification.average,
                guaranteeAchieved: verification.guaranteeAchieved,
            });

            // Atualizar estatísticas
            if (verification.guaranteeAchieved) {
                totalSuccesses++;
            }
            totalBestHits += verification.best;
            totalWorstHits += verification.worst;

            // Atualizar distribuição
            if (!distribution[verification.best]) {
                distribution[verification.best] = 0;
            }
            distribution[verification.best]++;
        }

        // Calcular sumário
        const summary: SimulationSummary = {
            totalContestsTested: contests.length,
            guaranteeSuccessRate: (totalSuccesses / contests.length) * 100,
            averageBestHits: totalBestHits / contests.length,
            averageWorstHits: totalWorstHits / contests.length,
            distribution,
        };

        return NextResponse.json({
            success: true,
            closingGames,
            statistics: closingResult.statistics,
            results,
            summary,
        });
    } catch (error) {
        console.error('Erro na simulação:', error);
        return NextResponse.json(
            { error: 'Ocorreu um erro ao processar a simulação.' },
            { status: 500 }
        );
    }
}
