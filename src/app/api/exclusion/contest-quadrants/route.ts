import { NextResponse } from 'next/server';

interface QuadrantNumbers {
    quadrant: number;
    numbers: number[];
    count: number;
}

/**
 * API para consultar os números sorteados de um concurso específico da Mega Sena organizados por quadrantes
 */
export async function POST(request: Request) {
    try {
        const { contestNumber } = await request.json();

        if (!contestNumber || isNaN(contestNumber)) {
            return NextResponse.json(
                { error: 'Número de concurso inválido' },
                { status: 400 }
            );
        }

        // Busca o concurso específico da Mega Sena
        const response = await fetch(
            `https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${contestNumber}`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Concurso não encontrado' },
                { status: 404 }
            );
        }

        const contestData = await response.json();

        if (!contestData.listaDezenas || !Array.isArray(contestData.listaDezenas)) {
            return NextResponse.json(
                { error: 'Dados do concurso inválidos' },
                { status: 400 }
            );
        }

        // Organiza números por quadrante
        const quadrants: { [key: number]: number[] } = {
            1: [],
            2: [],
            3: [],
            4: [],
        };

        contestData.listaDezenas.forEach((dezena: string) => {
            const num = parseInt(dezena);
            const quadrant = getNumberQuadrant(num);
            quadrants[quadrant].push(num);
        });

        // Ordena os números dentro de cada quadrante
        Object.keys(quadrants).forEach(q => {
            quadrants[parseInt(q)].sort((a, b) => a - b);
        });

        // Prepara resultado
        const quadrantData: QuadrantNumbers[] = [1, 2, 3, 4].map(q => ({
            quadrant: q,
            numbers: quadrants[q],
            count: quadrants[q].length,
        }));

        return NextResponse.json({
            success: true,
            contest: {
                number: contestData.numero,
                date: contestData.dataApuracao,
                totalDrawn: contestData.listaDezenas.length,
            },
            quadrants: quadrantData,
            allNumbers: contestData.listaDezenas.map((d: string) => parseInt(d)).sort((a: number, b: number) => a - b),
        });
    } catch (error) {
        console.error('Erro ao buscar concurso:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados do concurso' },
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
