import { NextResponse } from 'next/server';
import { CaixaAPI } from '@/lib/caixa-api';
import { db } from '@/lib/db';

export const revalidate = 300; // Revalida a cada 5 minutos

export async function GET() {
    try {
        // Busca o último concurso da API da Caixa
        const latestFromAPI = await CaixaAPI.getLatestContest();

        if (!latestFromAPI) {
            // Se a API falhar, busca do banco de dados local
            const latestFromDB = await db.contest.findFirst({
                orderBy: { concurso: 'desc' }
            });

            if (!latestFromDB) {
                return NextResponse.json(
                    { error: 'Não foi possível obter dados do último concurso' },
                    { status: 500 }
                );
            }

            // Mega Sena: 6 bolas sorteadas
            return NextResponse.json({
                contest: {
                    number: latestFromDB.concurso,
                    date: latestFromDB.dataSorteio,
                    drawnNumbers: [
                        latestFromDB.bola01, latestFromDB.bola02, latestFromDB.bola03,
                        latestFromDB.bola04, latestFromDB.bola05, latestFromDB.bola06
                    ]
                },
                nextContest: {
                    date: null,
                    estimatedPrize: null
                },
                prizes: null,
                fromCache: true
            });
        }

        // Busca informações detalhadas do último concurso da API da Caixa
        // Mega Sena usa endpoint /megasena/
        const response = await fetch(`https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${latestFromAPI.numero}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const detailedData = await response.json();

        // Extrair informações de premiação
        const prizes = detailedData.listaPremiacoes || detailedData.listaRateioPremio || [];

        // Mega Sena tem 3 faixas de prêmio:
        // Faixa 1 = Sena (6 acertos)
        // Faixa 2 = Quina (5 acertos) 
        // Faixa 3 = Quadra (4 acertos)
        return NextResponse.json({
            contest: {
                number: latestFromAPI.numero,
                date: latestFromAPI.dataApuracao,
                drawnNumbers: latestFromAPI.listaDezenas
            },
            nextContest: {
                date: latestFromAPI.dataProximoConcurso || null,
                estimatedPrize: latestFromAPI.valorEstimadoProximoConcurso || 0,
                accumulatedPrize: latestFromAPI.valorAcumuladoProximoConcurso || 0
            },
            prizes: prizes.map((prize: any) => {
                // Mapear faixas para acertos da Mega Sena
                let hits = 0;
                let description = '';

                if (prize.faixa === 1) {
                    hits = 6;
                    description = 'Sena (6 acertos)';
                } else if (prize.faixa === 2) {
                    hits = 5;
                    description = 'Quina (5 acertos)';
                } else if (prize.faixa === 3) {
                    hits = 4;
                    description = 'Quadra (4 acertos)';
                }

                return {
                    hits,
                    winners: prize.numeroDeGanhadores || prize.ganhadores || 0,
                    prizeAmount: prize.valorPremio || prize.valor || 0,
                    description: prize.descricaoFaixa || description
                };
            }),
            accumulated: latestFromAPI.acumulado || false,
            fromCache: false
        });

    } catch (error) {
        console.error('Error fetching latest contest details:', error);

        // Fallback para dados locais
        const latestFromDB = await db.contest.findFirst({
            orderBy: { concurso: 'desc' }
        });

        if (!latestFromDB) {
            return NextResponse.json(
                { error: 'Erro ao buscar informações do último concurso' },
                { status: 500 }
            );
        }

        // Mega Sena: 6 bolas sorteadas
        return NextResponse.json({
            contest: {
                number: latestFromDB.concurso,
                date: latestFromDB.dataSorteio,
                drawnNumbers: [
                    latestFromDB.bola01, latestFromDB.bola02, latestFromDB.bola03,
                    latestFromDB.bola04, latestFromDB.bola05, latestFromDB.bola06
                ]
            },
            nextContest: {
                date: null,
                estimatedPrize: null
            },
            prizes: null,
            fromCache: true,
            error: 'Dados limitados - API indisponível'
        });
    }
}
