import { NextRequest, NextResponse } from 'next/server';
import { cycleAnalyzer } from '@/lib/cycle-analyzer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Analysis type is required' }, { status: 400 });
    }

    switch (type) {
      case 'cycleStats':
        const cycleStats = await cycleAnalyzer.getCycleStats();
        return NextResponse.json({ data: cycleStats });
      case 'fullCycleAnalysis':
        const fullAnalysis = await cycleAnalyzer.getFullCycleAnalysis();
        return NextResponse.json({ data: fullAnalysis });
      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in ciclos API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
