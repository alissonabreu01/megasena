import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MEGASENA_CONFIG } from '@/lib/megasena-constants';

// Interface para prêmios
interface PrizeInfo {
    faixa: number;
    descricao: string;
    numeroDeGanhadores: number;
    valorPremio: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { games, contestNumber } = body;

        if (!games || !Array.isArray(games) || games.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum jogo fornecido para conferência.' },
                { status: 400 }
            );
        }

        if (!contestNumber || typeof contestNumber !== 'number') {
            return NextResponse.json(
                { error: 'Número do concurso inválido.' },
                { status: 400 }
            );
        }

        // Buscar o concurso no banco de dados
        const contest = await db.contest.findUnique({
            where: { concurso: contestNumber }
        });

        if (!contest) {
            return NextResponse.json(
                { error: `Concurso ${contestNumber} não encontrado no banco de dados.` },
                { status: 404 }
            );
        }

        // Buscar prêmios da API da Caixa
        // Mega Sena: 3 faixas de prêmio
        const prizes: PrizeInfo[] = [
            { faixa: 1, descricao: 'Sena (6 acertos)', numeroDeGanhadores: 0, valorPremio: 0 },
            { faixa: 2, descricao: 'Quina (5 acertos)', numeroDeGanhadores: 0, valorPremio: 0 },
            { faixa: 3, descricao: 'Quadra (4 acertos)', numeroDeGanhadores: 0, valorPremio: 0 }
        ];
        let prizesError: string | null = null;

        try {
            const response = await fetch(
                `https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${contestNumber}`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json'
                    },
                    signal: AbortSignal.timeout(10000)
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.listaRateioPremio && Array.isArray(data.listaRateioPremio)) {
                    // Atualizar as faixas com os dados da API
                    data.listaRateioPremio.forEach((p: any) => {
                        const faixaIndex = prizes.findIndex(prize => prize.faixa === p.faixa);
                        if (faixaIndex !== -1) {
                            prizes[faixaIndex] = {
                                faixa: p.faixa,
                                descricao: p.descricaoFaixa || prizes[faixaIndex].descricao,
                                numeroDeGanhadores: p.numeroDeGanhadores,
                                valorPremio: p.valorPremio
                            };
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao buscar prêmios:', error);
            prizesError = 'Não foi possível buscar os valores dos prêmios';
        }

        // Criar mapa de prêmios por acertos
        // Mega Sena: faixa 1 = 6, faixa 2 = 5, faixa 3 = 4
        const prizeByHits: { [key: number]: number } = {
            6: prizes[0].valorPremio,  // Sena
            5: prizes[1].valorPremio,  // Quina
            4: prizes[2].valorPremio   // Quadra
        };

        // Extrair os números sorteados do concurso (6 bolas da Mega Sena)
        const drawnNumbers = [
            contest.bola01, contest.bola02, contest.bola03,
            contest.bola04, contest.bola05, contest.bola06
        ].map(n => Number(n)).filter(n => !isNaN(n) && n > 0);

        const drawnSet = new Set(drawnNumbers);

        // Conferir cada jogo
        const results = games.map((game: string[], index: number) => {
            const gameNumbers = game.map(n => Number(n));

            // Validar se o jogo é válido (6 a 15 números)
            if (gameNumbers.length < MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME ||
                gameNumbers.length > MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME) {
                return null;
            }

            const hits = gameNumbers.filter(n => drawnSet.has(n));
            const misses = gameNumbers.filter(n => !drawnSet.has(n));
            const hitCount = hits.length;

            // Na Mega Sena, é premiado com 4, 5 ou 6 acertos
            const isPrized = hitCount >= 4 && hitCount <= 6;
            const prizeAmount = prizeByHits[hitCount] || 0;

            // Calcular custo baseado no número de dezenas
            const betCost = MEGASENA_CONFIG.BET_PRICES[gameNumbers.length as keyof typeof MEGASENA_CONFIG.BET_PRICES] || 5.00;

            return {
                index: index + 1,
                game: game,
                gameNumbers,
                hits: hits,
                hitCount,
                misses: misses,
                isPrized,
                prizeAmount,
                betCost
            };
        }).filter(r => r !== null);

        // Ordenar por quantidade de acertos (decrescente)
        results.sort((a, b) => b.hitCount - a.hitCount);

        // Estatísticas de distribuição de acertos (0 a 6 para Mega Sena)
        const hitDistribution: { [key: number]: number } = {};
        for (let i = 0; i <= 6; i++) {
            hitDistribution[i] = results.filter(r => r.hitCount === i).length;
        }

        const prizedCount = results.filter(r => r.isPrized).length;

        // Cálculo financeiro
        const totalCost = results.reduce((sum, r) => sum + (r.betCost || 5.00), 0);
        const totalEarnings = results.reduce((sum, r) => sum + r.prizeAmount, 0);
        const profit = totalEarnings - totalCost;
        const profitPercentage = totalCost > 0 ? ((profit / totalCost) * 100) : 0;

        // Custo médio por jogo (para exibição)
        const averageBetCost = results.length > 0 ? totalCost / results.length : 5.00;

        return NextResponse.json({
            contest: {
                number: contest.concurso,
                date: contest.dataSorteio,
                drawnNumbers: drawnNumbers
            },
            results,
            prizes,
            prizesError,
            summary: {
                totalGames: games.length,
                prizedCount,
                hitDistribution
            },
            financial: {
                betCost: averageBetCost,
                totalCost,
                totalEarnings,
                profit,
                profitPercentage,
                isProfit: profit > 0
            },
            message: `${games.length} jogo(s) conferido(s) no concurso ${contestNumber}. ${prizedCount} jogo(s) premiado(s)!`
        });

    } catch (error) {
        console.error('Error checking games:', error);
        return NextResponse.json(
            { error: 'Erro ao conferir os jogos. Tente novamente.' },
            { status: 500 }
        );
    }
}
