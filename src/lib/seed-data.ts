import { db } from '@/lib/db';

export async function seedDatabase() {
  try {
    // Check if database already has data
    const existingContests = await db.contest.count();
    if (existingContests > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }

    // Generate sample contests
    const sampleContests = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 1; i <= 50; i++) {
      const contestDate = new Date(startDate);
      contestDate.setDate(startDate.getDate() + (i * 3)); // Every 3 days
      
      // Generate 15 unique numbers from 1-25
      const numbers = new Set<number>();
      while (numbers.size < 15) {
        numbers.add(Math.floor(Math.random() * 25) + 1);
      }
      
      const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);
      
      const contest = {
        concurso: 3000 + i,
        dataSorteio: contestDate.toISOString().split('T')[0],
        ...Object.fromEntries(
          sortedNumbers.map((num, index) => [
            `bola${(index + 1).toString().padStart(2, '0')}`,
            num
          ])
        )
      };
      
      sampleContests.push(contest);
    }

    // Insert all contests
    await db.contest.createMany({
      data: sampleContests
    });

    console.log(`Successfully seeded ${sampleContests.length} contests`);
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}