/**
 * Constantes e configurações da Mega Sena
 */

export const MEGASENA_CONFIG = {
  // Números
  TOTAL_NUMBERS: 60,
  MIN_NUMBERS_PER_GAME: 6,
  MAX_NUMBERS_PER_GAME: 15,
  NUMBERS_DRAWN: 6,
  MIN_NUMBER: 1,
  MAX_NUMBER: 60,
  
  // Premiações
  PRIZE_TIERS: {
    SENA: 6,    // 6 acertos
    QUINA: 5,   // 5 acertos
    QUADRA: 4   // 4 acertos
  },
  
  // Grid visual (6 linhas x 10 colunas)
  GRID: {
    ROWS: 6,
    COLS: 10
  },
  
  // Preços de apostas (valores em reais - atualizar conforme necessário)
  BET_PRICES: {
    6: 5.00,
    7: 35.00,
    8: 140.00,
    9: 420.00,
    10: 1050.00,
    11: 2310.00,
    12: 4620.00,
    13: 8580.00,
    14: 15015.00,
    15: 25025.00
  }
} as const;

/**
 * Números da moldura (borda do volante)
 * Grid: 6 linhas x 10 colunas
 * 
 * Layout do volante:
 * [ 01  02  03  04  05  06  07  08  09  10 ]  <- Linha superior
 * [ 11  12  13  14  15  16  17  18  19  20 ]
 * [ 21  22  23  24  25  26  27  28  29  30 ]
 * [ 31  32  33  34  35  36  37  38  39  40 ]
 * [ 41  42  43  44  45  46  47  48  49  50 ]
 * [ 51  52  53  54  55  56  57  58  59  60 ]  <- Linha inferior
 *   ^                                     ^
 *   Coluna esquerda              Coluna direita
 */
export const FRAME_NUMBERS = [
  // Linha superior (1-10)
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  // Linha inferior (51-60)
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
  // Coluna esquerda (11, 21, 31, 41) - excluindo cantos já incluídos
  11, 21, 31, 41,
  // Coluna direita (20, 30, 40, 50) - excluindo cantos já incluídos
  20, 30, 40, 50
];

/**
 * Números do centro (não fazem parte da moldura)
 */
export const CENTER_NUMBERS = Array.from(
  { length: MEGASENA_CONFIG.TOTAL_NUMBERS },
  (_, i) => i + 1
).filter(n => !FRAME_NUMBERS.includes(n));

/**
 * Distribuição de quadrantes do volante
 */
export const QUADRANTS = {
  Q1: Array.from({ length: 15 }, (_, i) => i + 1),      // 1-15
  Q2: Array.from({ length: 15 }, (_, i) => i + 16),     // 16-30
  Q3: Array.from({ length: 15 }, (_, i) => i + 31),     // 31-45
  Q4: Array.from({ length: 15 }, (_, i) => i + 46)      // 46-60
} as const;

/**
 * Linhas do volante
 */
export const LINES = {
  L1: Array.from({ length: 10 }, (_, i) => i + 1),      // 1-10
  L2: Array.from({ length: 10 }, (_, i) => i + 11),     // 11-20
  L3: Array.from({ length: 10 }, (_, i) => i + 21),     // 21-30
  L4: Array.from({ length: 10 }, (_, i) => i + 31),     // 31-40
  L5: Array.from({ length: 10 }, (_, i) => i + 41),     // 41-50
  L6: Array.from({ length: 10 }, (_, i) => i + 51)      // 51-60
} as const;

/**
 * Colunas do volante
 */
export const COLUMNS = {
  C1: [1, 11, 21, 31, 41, 51],
  C2: [2, 12, 22, 32, 42, 52],
  C3: [3, 13, 23, 33, 43, 53],
  C4: [4, 14, 24, 34, 44, 54],
  C5: [5, 15, 25, 35, 45, 55],
  C6: [6, 16, 26, 36, 46, 56],
  C7: [7, 17, 27, 37, 47, 57],
  C8: [8, 18, 28, 38, 48, 58],
  C9: [9, 19, 29, 39, 49, 59],
  C10: [10, 20, 30, 40, 50, 60]
} as const;

/**
 * Números primos até 60
 */
export const PRIME_NUMBERS = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
  31, 37, 41, 43, 47, 53, 59
];

/**
 * Estatísticas típicas da Mega Sena
 */
export const TYPICAL_STATS = {
  // Soma típica de um jogo de 6 números
  SUM: {
    MIN: 21,      // Mínimo teórico: 1+2+3+4+5+6
    MAX: 345,     // Máximo teórico: 55+56+57+58+59+60
    TYPICAL_MIN: 90,
    TYPICAL_MAX: 240
  },
  
  // Distribuição típica de pares/ímpares
  EVEN_ODD: {
    BALANCED: [3, 3],  // 3 pares, 3 ímpares (mais comum)
    VARIATIONS: [
      [0, 6], [1, 5], [2, 4], [3, 3], [4, 2], [5, 1], [6, 0]
    ]
  },
  
  // Números na moldura (típico em um jogo de 6)
  FRAME: {
    MIN: 0,
    MAX: 6,
    TYPICAL: 2  // Geralmente 2-3 números da moldura
  }
};

/**
 * Calcula o número de combinações possíveis
 * C(n, k) = n! / (k! * (n-k)!)
 */
export function calculateCombinations(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = result * (n - k + i) / i;
  }
  
  return Math.round(result);
}

/**
 * Retorna o número total de combinações para uma aposta
 */
export function getTotalCombinations(numbersSelected: number): number {
  return calculateCombinations(MEGASENA_CONFIG.TOTAL_NUMBERS, numbersSelected);
}

// Exportar combinações comuns
export const COMMON_COMBINATIONS = {
  SIMPLE_BET: getTotalCombinations(6),        // 50.063.860
  DOUBLE_BET: getTotalCombinations(7),        // 7 números escolhidos
  MAX_BET: getTotalCombinations(15)           // 15 números escolhidos
};
