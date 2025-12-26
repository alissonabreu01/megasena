import { NextRequest, NextResponse } from 'next/server';
import { gameGenerator } from '@/lib/game-generator';
import { cycleAnalyzer } from '@/lib/cycle-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { numGames, topNUrgency, filters, useWeightedScore, weights } = await request.json();

    if (!numGames || !topNUrgency) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const cycleStats = await cycleAnalyzer.getCycleStats();

    const generatedGames = gameGenerator.generateGamesBasedOnCycles(cycleStats, {
      numGames,
      topNUrgency,
      filters,
      useWeightedScore,
      weights
    });

    return NextResponse.json({ games: generatedGames, count: generatedGames.length });
  } catch (error) {
    console.error('Error in generate-cycle-games API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
