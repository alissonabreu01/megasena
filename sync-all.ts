import { PrismaClient } from '@prisma/client';
import { CaixaAPI } from './src/lib/caixa-api';

const prisma = new PrismaClient();

async function syncAllContests() {
    try {
        console.log('🚀 Iniciando sincronização completa da Mega Sena...\n');

        // 1. Verificar API
        console.log('1️⃣ Verificando disponibilidade da API...');
        const apiAvailable = await CaixaAPI.checkAPIStatus();
        if (!apiAvailable) {
            console.error('❌ API da Caixa está indisponível');
            return;
        }
        console.log('✅ API disponível\n');

        // 2. Buscar último concurso local
        const latestLocal = await prisma.contest.findFirst({
            orderBy: { concurso: 'desc' }
        });
        const latestLocalNumber = latestLocal?.concurso || 0;
        console.log(`2️⃣ Último concurso no banco local: ${latestLocalNumber}\n`);

        // 3. Buscar último concurso da API
        console.log('3️⃣ Buscando último concurso da API da Caixa...');
        const latestFromAPI = await CaixaAPI.getLatestContest();

        if (!latestFromAPI) {
            console.error('❌ Não foi possível obter o último concurso da API');
            return;
        }

        const latestAPINumber = latestFromAPI.numero;
        console.log(`✅ Último concurso na API: ${latestAPINumber}\n`);

        // 4. Verificar se já está atualizado
        if (latestLocalNumber >= latestAPINumber) {
            console.log('✅ Banco de dados já está atualizado!');
            return;
        }

        console.log(`4️⃣ Iniciando importação de ${latestAPINumber - latestLocalNumber} concursos...\n`);
        console.log(`   Do concurso ${latestLocalNumber + 1} até ${latestAPINumber}\n`);

        // 5. Importar em lotes
        let currentNumber = latestLocalNumber;
        const batchSize = 200;
        let totalImported = 0;
        let batchCount = 0;

        while (currentNumber < latestAPINumber) {
            const startContest = currentNumber + 1;
            const endContest = Math.min(startContest + batchSize - 1, latestAPINumber);
            batchCount++;

            console.log(`📦 Lote ${batchCount}: Buscando concursos ${startContest} a ${endContest}...`);

            const contests = await CaixaAPI.getContestsBatch(startContest, endContest);

            if (contests.length === 0) {
                console.log('⚠️  Nenhum concurso retornado, finalizando...');
                break;
            }

            let savedInBatch = 0;
            for (const contestData of contests) {
                try {
                    const dbData = CaixaAPI.convertToDatabaseFormat(contestData);

                    const existing = await prisma.contest.findUnique({
                        where: { concurso: dbData.concurso }
                    });

                    if (!existing) {
                        await prisma.contest.create({ data: dbData });
                        savedInBatch++;
                        totalImported++;
                    }
                } catch (error) {
                    console.error(`   ❌ Erro ao salvar concurso ${contestData.numero}:`, error.message);
                }
            }

            console.log(`   ✅ Salvos: ${savedInBatch}/${contests.length} concursos`);
            console.log(`   📊 Total importado até agora: ${totalImported}\n`);

            currentNumber = contests[contests.length - 1].numero;

            // Pequena pausa entre lotes para não sobrecarregar a API
            if (currentNumber < latestAPINumber) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('\n🎉 Sincronização concluída!');
        console.log(`📊 Total de novos concursos importados: ${totalImported}`);
        console.log(`📅 Último concurso: ${currentNumber}`);

        // Verificar total no banco
        const total = await prisma.contest.count();
        console.log(`💾 Total de concursos no banco: ${total}\n`);

    } catch (error) {
        console.error('\n❌ Erro durante sincronização:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncAllContests();
