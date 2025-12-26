import { NextResponse } from 'next/server';
import { runMonteCarloSimulation } from '../../../lib/monte-carlo';
import { db } from '../../../lib/db';

export async function GET() {
    try {
        const lastContest = await db.contest.findFirst({
            orderBy: {
                concurso: 'desc'
            }
        });

        if (!lastContest) {
            return NextResponse.json({ error: 'Nenhum concurso encontrado no banco de dados.' }, { status: 404 });
        }

        const lastContestNumbers = new Set([
            lastContest.bola01,
            lastContest.bola02,
            lastContest.bola03,
            lastContest.bola04,
            lastContest.bola05,
            lastContest.bola06,
            lastContest.bola07,
            lastContest.bola08,
            lastContest.bola09,
            lastContest.bola10,
            lastContest.bola11,
            lastContest.bola12,
            lastContest.bola13,
            lastContest.bola14,
            lastContest.bola15,
        ]);

        const results = runMonteCarloSimulation(100000, lastContestNumbers); // 100k simulações

        return NextResponse.json(results);
    } catch (error) {
        console.error('Erro ao executar a simulação de Monte Carlo:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
