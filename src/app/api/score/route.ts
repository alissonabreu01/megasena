import { NextRequest, NextResponse } from 'next/server';
import { calculateQualityScore } from '@/lib/quality-score';
import { MEGASENA_CONFIG } from '@/lib/megasena-constants';

export async function POST(request: NextRequest) {
  try {
    const { game } = await request.json();

    // Validação para Mega Sena: 6 a 15 números de 1-60
    if (!Array.isArray(game)) {
      return NextResponse.json(
        { error: 'O jogo deve ser um array de números.' },
        { status: 400 }
      );
    }

    const gameSize = game.length;

    if (
      gameSize < MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME ||
      gameSize > MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME
    ) {
      return NextResponse.json(
        {
          error: `O jogo deve conter entre ${MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME} e ${MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME} números.`,
        },
        { status: 400 }
      );
    }

    if (
      game.some(
        (n) =>
          typeof n !== 'number' ||
          n < MEGASENA_CONFIG.MIN_NUMBER ||
          n > MEGASENA_CONFIG.MAX_NUMBER
      )
    ) {
      return NextResponse.json(
        {
          error: `Todos os números devem estar entre ${MEGASENA_CONFIG.MIN_NUMBER} e ${MEGASENA_CONFIG.MAX_NUMBER}.`,
        },
        { status: 400 }
      );
    }

    const uniqueGame = [...new Set(game)];
    if (uniqueGame.length !== gameSize) {
      return NextResponse.json(
        { error: 'O jogo não pode conter números repetidos.' },
        { status: 400 }
      );
    }

    // Usar o sistema de qualidade já adaptado
    const result = calculateQualityScore(uniqueGame);

    // Formatar detalhes das violações
    const details = result.violations.map((violation) => ({
      message: violation,
      score: -10, // Estimativa genérica, pois calculateQualityScore não retorna scores individuais
    }));

    return NextResponse.json({
      totalScore: result.score,
      details,
      metrics: result.metrics,
    });
  } catch (error) {
    console.error('Error in score API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
