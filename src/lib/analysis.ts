// Extracted from /api/games/route.ts

// Extracted from /api/games/route.ts

export const PRIME_NUMBERS = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
export const FIBONACCI_NUMBERS = new Set([0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
export const MULTIPLES_OF_3 = new Set(Array.from({ length: 34 }, (_, i) => i * 3)); // 0, 3, ..., 99
export const FRAME_NUMBERS = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 19, 20, 29, 30, 39, 40, 49,
  50, 59, 60, 69, 70, 79, 80, 89,
  90, 91, 92, 93, 94, 95, 96, 97, 98, 99
]);

export function isGameBalanced(game: number[], lastContestNumbers: Set<number>): boolean {
  const gameSet = new Set(game);

  // Lotomania: 50 numbers chosen

  // Check repeated numbers (from last contest's 20 numbers)
  // Strategy suggests 2-6 repeats in the *result*. 
  // If we pick 50 numbers, we might expect more overlap with the previous 20.
  // Randomly, 50/100 numbers covers 50% of the board. So we expect ~10 repeats of the previous 20.
  // Let's set a broad range for now.
  const repeatedCount = [...gameSet].filter(n => lastContestNumbers.has(n)).length;
  if (repeatedCount < 5 || repeatedCount > 15) return false;

  // Check even/odd balance (aim for 25/25)
  const evenCount = [...gameSet].filter(n => n % 2 === 0).length;
  if (evenCount < 20 || evenCount > 30) return false;

  // Check sum range (Avg 2475)
  const sum = [...gameSet].reduce((a, b) => a + b, 0);
  if (sum < 2000 || sum > 3000) return false;

  // Check frame balance (36 numbers in frame, expected ~18)
  const frameCount = [...gameSet].filter(n => FRAME_NUMBERS.has(n)).length;
  if (frameCount < 12 || frameCount > 24) return false;

  // Check prime numbers (25 primes, expected ~12.5)
  const primeCount = [...gameSet].filter(n => PRIME_NUMBERS.has(n)).length;
  if (primeCount < 8 || primeCount > 17) return false;

  // Check row distribution (should cover most rows)
  const rows = new Set([...gameSet].map(n => Math.floor(n / 10))); // 0-9 rows
  if (rows.size < 8) return false; // Should cover at least 8 of 10 rows

  return true;
}