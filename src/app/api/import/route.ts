import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema para validar cada linha da planilha
const ContestRowSchema = z.object({
  concurso: z.coerce.number().int().positive(),
  dataSorteio: z.preprocess((arg) => {
    if (arg instanceof Date) {
      return arg;
    }
    if (typeof arg === 'string') {
      // Tenta converter o formato DD/MM/YYYY ou DD-MM-YYYY
      const parts = arg.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (parts) {
        // new Date(year, monthIndex, day)
        const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Fallback para outros formatos (ex: YYYY-MM-DD)
      const genericDate = new Date(arg);
      if (!isNaN(genericDate.getTime())) {
        return genericDate;
      }
    }
    return arg; // Retorna o original para falhar na validação z.date()
  }, z.date({ invalid_type_error: "Formato de data inválido. Use DD/MM/AAAA." })),
  bola01: z.coerce.number().int().min(1).max(25),
  bola02: z.coerce.number().int().min(1).max(25),
  bola03: z.coerce.number().int().min(1).max(25),
  bola04: z.coerce.number().int().min(1).max(25),
  bola05: z.coerce.number().int().min(1).max(25),
  bola06: z.coerce.number().int().min(1).max(25),
  bola07: z.coerce.number().int().min(1).max(25),
  bola08: z.coerce.number().int().min(1).max(25),
  bola09: z.coerce.number().int().min(1).max(25),
  bola10: z.coerce.number().int().min(1).max(25),
  bola11: z.coerce.number().int().min(1).max(25),
  bola12: z.coerce.number().int().min(1).max(25),
  bola13: z.coerce.number().int().min(1).max(25),
  bola14: z.coerce.number().int().min(1).max(25),
  bola15: z.coerce.number().int().min(1).max(25),
});

// Schema para o corpo da requisição (array de concursos)
const ImportPayloadSchema = z.array(ContestRowSchema);

/**
 * Mapeia as chaves de um objeto de concurso para o formato do schema.
 * Lida com variações de capitalização, espaços e nomes de bolas.
 */
function mapContestData(rawData: any[]): any[] {
  return rawData.map(row => {
    const normalizedRow: { [key: string]: any } = {};
    for (const key in row) {
      normalizedRow[key.toLowerCase().replace(/\s/g, '')] = row[key];
    }

    const mappedRow: { [key: string]: any } = {};
    mappedRow.concurso = normalizedRow.concurso;
    mappedRow.dataSorteio = normalizedRow.datasorteio;

    for (let i = 1; i <= 15; i++) {
      const schemaKey = `bola${String(i).padStart(2, '0')}`;
      const rawKey = `bola${i}`;
      if (normalizedRow[rawKey] !== undefined) {
        mappedRow[schemaKey] = normalizedRow[rawKey];
      }
    }
    return mappedRow;
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Mapear os dados recebidos para o formato esperado
    const mappedData = mapContestData(body);

    // 2. Validar o payload mapeado
    const validationResult = ImportPayloadSchema.safeParse(mappedData);

    if (!validationResult.success) {
      console.error('Erro de validação após mapeamento:', validationResult.error.flatten());
      return NextResponse.json(
        { 
          message: 'Dados inválidos. Verifique se as colunas da planilha estão corretas (Ex: Concurso, Data Sorteio, Bola1, etc.).',
          errors: validationResult.error.flatten(),
        }, 
        { status: 400 }
      );
    }

    const contests = validationResult.data;
    let createdCount = 0;
    let skippedCount = 0;

    // 3. Inserir dados no banco de dados
    for (const contest of contests) {
      try {
        await prisma.contest.create({
          data: contest,
        });
        createdCount++;
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('concurso')) {
          skippedCount++;
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({
      message: 'Importação concluída com sucesso!',
      created: createdCount,
      skipped: skippedCount,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no servidor durante a importação:', error);
    return NextResponse.json({ message: 'Erro interno do servidor', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
