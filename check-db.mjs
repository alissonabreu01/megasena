import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        const total = await prisma.contest.count();
        console.log(`\n✅ Total de concursos no banco: ${total}`);

        if (total > 0) {
            const latest = await prisma.contest.findFirst({
                orderBy: { concurso: 'desc' }
            });

            const oldest = await prisma.contest.findFirst({
                orderBy: { concurso: 'asc' }
            });

            console.log(`\n📊 Estatísticas:`);
            console.log(`- Concurso mais antigo: ${oldest?.concurso}`);
            console.log(`- Concurso mais recente: ${latest?.concurso}`);
            console.log(`\n📝 Último concurso:`);
            console.log(JSON.stringify(latest, null, 2));
        } else {
            console.log('\n⚠️  Nenhum concurso encontrado no banco de dados.');
        }
    } catch (error) {
        console.error('\n❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
