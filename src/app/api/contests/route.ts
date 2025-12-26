import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CaixaAPI } from '@/lib/caixa-api';
import { PRIME_NUMBERS, FRAME_NUMBERS, CENTER_NUMBERS } from '@/lib/megasena-constants';

export const revalidate = 0;

// Constants for analysis (Mega Sena)
const FIBONACCI_NUMBERS = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55]);
const MULTIPLES_OF_3 = new Set([3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let whereClause = {};
    if (search) {
      const isNumber = /^\d+$/.test(search);
      if (isNumber) {
        whereClause = { concurso: parseInt(search) };
      } else {
        whereClause = { dataSorteio: { contains: search } };
      }
    }

    const contests = await db.contest.findMany({
      where: whereClause,
      orderBy: { concurso: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.contest.count({ where: whereClause });

    return NextResponse.json({
      contests,
      pagination: { total, limit, offset }
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'updateFromAPI') {
      return await updateFromCaixaAPI();
    }

    if (action === 'importFromData') {
      const { contests } = body;
      return await importContests(contests);
    }

    if (action === 'checkAPIStatus') {
      return await checkAPIStatus();
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/contests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkAPIStatus() {
  try {
    const isAvailable = await CaixaAPI.checkAPIStatus();

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable
        ? 'API da Caixa está disponível'
        : 'API da Caixa está indisponível no momento'
    });
  } catch (error) {
    console.error('Error checking API status:', error);
    return NextResponse.json(
      { available: false, message: 'Erro ao verificar status da API' },
      { status: 500 }
    );
  }
}

async function updateFromCaixaAPI() {
  try {
    console.log('Iniciando atualização da API da Caixa...');

    // 1. Verificar se a API está disponível
    const apiAvailable = await CaixaAPI.checkAPIStatus();
    if (!apiAvailable) {
      return NextResponse.json(
        { error: 'API da Caixa está indisponível no momento. Tente novamente mais tarde.' },
        { status: 503 }
      );
    }

    // 2. Obter último concurso local
    const latestLocal = await db.contest.findFirst({
      orderBy: { concurso: 'desc' }
    });

    const latestLocalNumber = latestLocal?.concurso || 0;
    console.log(`Último concurso local: ${latestLocalNumber}`);

    // 3. Obter último concurso da API da Caixa
    const latestFromAPI = await CaixaAPI.getLatestContest();

    if (!latestFromAPI) {
      return NextResponse.json(
        { error: 'Não foi possível obter o último concurso da API da Caixa' },
        { status: 500 }
      );
    }

    const latestAPINumber = latestFromAPI.numero;
    console.log(`Último concurso da API: ${latestAPINumber}`);

    // 4. Verificar se já está atualizado
    if (latestLocalNumber >= latestAPINumber) {
      return NextResponse.json({
        message: 'Banco de dados já está atualizado',
        latestContest: latestLocalNumber,
        newContests: 0
      });
    }

    let currentLocalNumber = latestLocalNumber;
    const allSavedContests = [];
    const batchSize = 200; // Processar em lotes de 200

    console.log(`Iniciando importação em lote a partir do concurso ${currentLocalNumber + 1}`);

    while (currentLocalNumber < latestAPINumber) {
      const startContest = currentLocalNumber + 1;
      const endContest = Math.min(startContest + batchSize - 1, latestAPINumber);

      console.log(`Buscando lote de concursos: de ${startContest} a ${endContest}`);

      const newContests = await CaixaAPI.getContestsBatch(startContest, endContest);

      if (newContests.length === 0) {
        console.log('Nenhum concurso novo encontrado no lote, finalizando importação.');
        break; // Sai do loop se a API não retornar mais concursos
      }

      const batchSavedContests = [];
      for (const contestData of newContests) {
        try {
          const dbData = CaixaAPI.convertToDatabaseFormat(contestData);
          const existing = await db.contest.findUnique({
            where: { concurso: dbData.concurso },
          });

          if (!existing) {
            const saved = await db.contest.create({ data: dbData });
            batchSavedContests.push(saved);
          }
        } catch (error) {
          console.error(`Erro ao salvar concurso ${contestData.numero}:`, error);
        }
      }

      if (batchSavedContests.length > 0) {
        allSavedContests.push(...batchSavedContests);
        // Atualiza o número do último concurso processado neste lote
        currentLocalNumber = newContests[newContests.length - 1].numero;
        console.log(`${batchSavedContests.length} concursos salvos neste lote. Último salvo: ${currentLocalNumber}`);
      } else {
        // Se nenhum concurso foi salvo (ex: todos já existiam), avançamos para o final do lote para não ficar em loop
        currentLocalNumber = endContest;
        console.log('Nenhum concurso novo para salvar neste lote, avançando para o próximo.');
      }
    }

    const message = allSavedContests.length > 0
      ? `Importação em lote concluída. Total de ${allSavedContests.length} novos concursos importados.`
      : 'Nenhum concurso novo foi importado.';

    return NextResponse.json({
      message,
      latestContest: latestAPINumber,
      newContests: allSavedContests.length,
      hasMore: currentLocalNumber < latestAPINumber,
    });

  } catch (error) {
    console.error('Error updating from Caixa API:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar dados da API da Caixa. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

async function importContests(contests: any[]) {
  try {
    const results = [];

    for (const contestData of contests) {
      try {
        const existing = await db.contest.findUnique({
          where: { concurso: contestData.concurso }
        });

        if (!existing) {
          const contest = await db.contest.create({
            data: {
              concurso: contestData.concurso,
              dataSorteio: contestData.data_sorteio,
              bola01: contestData.bola1,
              bola02: contestData.bola2,
              bola03: contestData.bola3,
              bola04: contestData.bola4,
              bola05: contestData.bola5,
              bola06: contestData.bola6,
              bola07: contestData.bola7,
              bola08: contestData.bola8,
              bola09: contestData.bola9,
              bola10: contestData.bola10,
              bola11: contestData.bola11,
              bola12: contestData.bola12,
              bola13: contestData.bola13,
              bola14: contestData.bola14,
              bola15: contestData.bola15,
            }
          });
          results.push(contest);
        }
      } catch (error) {
        console.error(`Error importing contest ${contestData.concurso}:`, error);
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${results.length} contests`,
      contests: results
    });
  } catch (error) {
    console.error('Error importing contests:', error);
    return NextResponse.json(
      { error: 'Failed to import contests' },
      { status: 500 }
    );
  }
}