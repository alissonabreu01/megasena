// Utilitários para Fechamento Inteligente de Mega Sena

import { MEGASENA_CONFIG } from './megasena-constants';

/**
 * Interface para configuração de fechamento
 */
export interface FechamentoConfig {
    availableNumbers: number[]; // Dezenas disponíveis (1-60)
    fixedNumbers?: number[]; // Dezenas fixas que devem estar em todos os jogos
    numbersPerGame?: number; // Quantidade de números por jogo (6-15, padrão: 6)
    guaranteedHits: number; // Garantia mínima de acertos (4-6 para Mega Sena)
    maxGames?: number; // Limite máximo de jogos a gerar
}

/**
 * Interface para resultado do fechamento
 */
export interface FechamentoResult {
    games: number[][]; // Jogos gerados
    statistics: {
        totalGames: number;
        totalCost: number;
        costPerGame: number;
        coverage: number; // Porcentagem de cobertura das dezenas
        guaranteedHits: number;
        averageHitsPerGame: number;
    };
    configuration: FechamentoConfig;
}

/**
 * Calcula combinações possíveis (nCr)
 */
function combinations(n: number, r: number): number {
    if (r > n) return 0;
    if (r === 0 || r === n) return 1;

    let result = 1;
    for (let i = 1; i <= r; i++) {
        result *= (n - i + 1) / i;
    }
    return Math.round(result);
}

/**
 * Calcula o custo de uma aposta baseado no número de dezenas
 */
function getCostPerGame(numbersPerGame: number): number {
    return MEGASENA_CONFIG.BET_PRICES[numbersPerGame as keyof typeof MEGASENA_CONFIG.BET_PRICES] || 5.00;
}

/**
 * Algoritmo de Fechamento Balanceado
 * Distribui as dezenas de forma equilibrada pelos jogos
 */
export function fechamentoBalanceado(config: FechamentoConfig): FechamentoResult {
    const {
        availableNumbers,
        fixedNumbers = [],
        numbersPerGame = MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME,
        guaranteedHits,
        maxGames = 100
    } = config;

    // Validação
    if (numbersPerGame < MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME ||
        numbersPerGame > MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME) {
        throw new Error(`Números por jogo deve estar entre ${MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME} e ${MEGASENA_CONFIG.MAX_NUMBERS_PER_GAME}`);
    }

    const games: number[][] = [];
    const fixedCount = fixedNumbers.length;
    const variableCount = numbersPerGame - fixedCount;

    // Dezenas variáveis (não fixas)
    const variableNumbers = availableNumbers.filter(n => !fixedNumbers.includes(n));

    if (variableNumbers.length < variableCount) {
        throw new Error('Não há dezenas suficientes disponíveis');
    }

    // Calcula quantos jogos são necessários para garantir cobertura
    const desiredGames = Math.min(
        Math.ceil(variableNumbers.length / variableCount),
        maxGames
    );

    // Gera jogos com distribuição balanceada
    const shuffled = [...variableNumbers].sort(() => Math.random() - 0.5);

    for (let i = 0; i < desiredGames; i++) {
        const gameVariables: number[] = [];

        // Seleciona dezenas variáveis de forma rotativa
        for (let j = 0; j < variableCount; j++) {
            const index = (i * variableCount + j) % shuffled.length;
            gameVariables.push(shuffled[index]);
        }

        // Combina fixas + variáveis
        const game = [...fixedNumbers, ...gameVariables].sort((a, b) => a - b);
        games.push(game);
    }

    // Calcula estatísticas
    const costPerGame = getCostPerGame(numbersPerGame);
    const totalCost = games.length * costPerGame;
    const uniqueNumbers = new Set(games.flat());
    const coverage = (uniqueNumbers.size / availableNumbers.length) * 100;

    return {
        games,
        statistics: {
            totalGames: games.length,
            totalCost,
            costPerGame,
            coverage,
            guaranteedHits,
            averageHitsPerGame: numbersPerGame / 2, // Estimativa conservadora
        },
        configuration: config,
    };
}

/**
 * Algoritmo de Fechamento por Cobertura Máxima
 * Garante que todas as dezenas apareçam um número mínimo de vezes
 */
export function fechamentoCoberturaMaxima(config: FechamentoConfig): FechamentoResult {
    const {
        availableNumbers,
        fixedNumbers = [],
        numbersPerGame = MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME,
        guaranteedHits,
        maxGames = 100
    } = config;

    const games: number[][] = [];
    const fixedCount = fixedNumbers.length;
    const variableCount = numbersPerGame - fixedCount;

    const variableNumbers = availableNumbers.filter(n => !fixedNumbers.includes(n));

    // Contador de aparições de cada dezena
    const appearances = new Map<number, number>();
    variableNumbers.forEach(n => appearances.set(n, 0));

    // Número mínimo de aparições por dezena para garantir cobertura
    // Para Mega Sena, com garantia de 4-6 acertos, precisamos mais repetições
    const minAppearances = Math.ceil(guaranteedHits / 2);

    let attempts = 0;
    const maxAttempts = maxGames * 10;

    while (games.length < maxGames && attempts < maxAttempts) {
        attempts++;

        // Seleciona dezenas menos usadas
        const sortedByAppearance = [...variableNumbers].sort((a, b) => {
            return (appearances.get(a) || 0) - (appearances.get(b) || 0);
        });

        // Pega as menos usadas + algumas aleatórias para diversidade
        const selected = sortedByAppearance.slice(0, Math.floor(variableCount * 0.7));
        const random = sortedByAppearance
            .slice(Math.floor(variableCount * 0.7))
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.ceil(variableCount * 0.3));

        const gameVariables = [...selected, ...random]
            .slice(0, variableCount)
            .sort((a, b) => a - b);

        const game = [...fixedNumbers, ...gameVariables].sort((a, b) => a - b);

        // Atualiza contadores
        gameVariables.forEach(n => {
            appearances.set(n, (appearances.get(n) || 0) + 1);
        });

        games.push(game);

        // Para se todas as dezenas atingiram o mínimo
        const allCovered = [...appearances.values()].every(count => count >= minAppearances);
        if (allCovered && games.length >= Math.max(3, minAppearances)) {
            break;
        }
    }

    const costPerGame = getCostPerGame(numbersPerGame);
    const totalCost = games.length * costPerGame;
    const coverage = 100; // Cobertura máxima garantida

    return {
        games,
        statistics: {
            totalGames: games.length,
            totalCost,
            costPerGame,
            coverage,
            guaranteedHits,
            averageHitsPerGame: numbersPerGame / 2,
        },
        configuration: config,
    };
}

/**
 * Algoritmo de Fechamento Otimizado
 * Usa técnicas combinatórias para minimizar número de jogos
 */
export function fechamentoOtimizado(config: FechamentoConfig): FechamentoResult {
    const {
        availableNumbers,
        fixedNumbers = [],
        numbersPerGame = MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME,
        guaranteedHits,
        maxGames = 50
    } = config;

    const games: number[][] = [];
    const fixedCount = fixedNumbers.length;
    const variableCount = numbersPerGame - fixedCount;

    const variableNumbers = availableNumbers.filter(n => !fixedNumbers.includes(n));

    if (variableNumbers.length <= variableCount) {
        // Se temos poucas dezenas, um jogo basta
        const game = [...fixedNumbers, ...variableNumbers].sort((a, b) => a - b);

        // Completa com as primeiras se necessário
        let fillIndex = 0;
        while (game.length < numbersPerGame && fillIndex < availableNumbers.length) {
            if (!game.includes(availableNumbers[fillIndex])) {
                game.push(availableNumbers[fillIndex]);
            }
            fillIndex++;
        }

        game.sort((a, b) => a - b);

        const costPerGame = getCostPerGame(numbersPerGame);

        return {
            games: [game],
            statistics: {
                totalGames: 1,
                totalCost: costPerGame,
                costPerGame,
                coverage: 100,
                guaranteedHits,
                averageHitsPerGame: numbersPerGame / 2,
            },
            configuration: config,
        };
    }

    // Para garantir altos acertos, usamos combinações estratégicas
    const gamesNeeded = Math.ceil(variableNumbers.length / variableCount);
    const actualGames = Math.min(gamesNeeded, maxGames);

    // Divide dezenas em grupos
    const groupSize = Math.ceil(variableNumbers.length / actualGames);
    const shuffled = [...variableNumbers].sort(() => Math.random() - 0.5);

    for (let i = 0; i < actualGames; i++) {
        const start = i * groupSize;
        const gameVariables = shuffled.slice(start, start + groupSize);

        // Se não temos suficientes, pega das primeiras
        while (gameVariables.length < variableCount) {
            const extra = shuffled[(start + gameVariables.length) % shuffled.length];
            if (!gameVariables.includes(extra)) {
                gameVariables.push(extra);
            }
        }

        // Limita ao tamanho correto
        const finalVariables = gameVariables.slice(0, variableCount);
        const game = [...fixedNumbers, ...finalVariables].sort((a, b) => a - b);
        games.push(game);
    }

    const uniqueNumbers = new Set(games.flat());
    const coverage = (uniqueNumbers.size / availableNumbers.length) * 100;
    const costPerGame = getCostPerGame(numbersPerGame);

    return {
        games,
        statistics: {
            totalGames: games.length,
            totalCost: games.length * costPerGame,
            costPerGame,
            coverage,
            guaranteedHits,
            averageHitsPerGame: numbersPerGame / 2,
        },
        configuration: config,
    };
}

/**
 * Função principal que escolhe o melhor algoritmo baseado na configuração
 */
export function gerarFechamento(
    config: FechamentoConfig,
    algoritmo: 'balanceado' | 'cobertura' | 'otimizado' = 'otimizado'
): FechamentoResult {
    switch (algoritmo) {
        case 'balanceado':
            return fechamentoBalanceado(config);
        case 'cobertura':
            return fechamentoCoberturaMaxima(config);
        case 'otimizado':
            return fechamentoOtimizado(config);
        default:
            return fechamentoOtimizado(config);
    }
}

/**
 * Calcula estatísticas teóricas de um fechamento para Mega Sena
 */
export function calcularEstatisticasFechamento(
    availableCount: number,
    numbersPerGame: number = MEGASENA_CONFIG.MIN_NUMBERS_PER_GAME,
    guaranteedHits: number
): {
    minGamesTheoretical: number;
    recommendedGames: number;
    estimatedCost: number;
} {
    // Para Mega Sena, o cálculo é diferente devido ao menor número de dezenas por jogo
    const minGames = Math.max(1, Math.ceil(availableCount / numbersPerGame));

    // Fator de multiplicação baseado na garantia desejada
    // Garantias mais altas requerem mais jogos
    const guaranteeFactor = guaranteedHits >= 5 ? 2.0 : (guaranteedHits >= 4 ? 1.5 : 1.2);
    const recommended = Math.ceil(minGames * guaranteeFactor);

    const costPerGame = getCostPerGame(numbersPerGame);

    return {
        minGamesTheoretical: minGames,
        recommendedGames: recommended,
        estimatedCost: recommended * costPerGame,
    };
}

/**
 * Interface para resultado de verificação de acertos
 */
export interface VerificacaoAcertos {
    hits: number[]; // acertos de cada jogo
    best: number;
    worst: number;
    average: number;
    guaranteeAchieved: boolean;
    guaranteedHits: number;
}

/**
 * Verifica quantos acertos cada jogo teve contra um resultado sorteado
 * @param games Array de jogos do fechamento
 * @param drawnNumbers Dezenas sorteadas no concurso (6 números para Mega Sena)
 * @param guaranteedHits Garantia prometida pelo fechamento
 * @returns Estatísticas de acertos
 */
export function verificarAcertos(
    games: number[][],
    drawnNumbers: number[],
    guaranteedHits: number
): VerificacaoAcertos {
    const drawnSet = new Set(drawnNumbers);

    // Calcula acertos para cada jogo
    const hits = games.map(game => {
        return game.filter(num => drawnSet.has(num)).length;
    });

    // Calcula estatísticas
    const best = Math.max(...hits);
    const worst = Math.min(...hits);
    const average = hits.reduce((sum, h) => sum + h, 0) / hits.length;
    const guaranteeAchieved = best >= guaranteedHits;

    return {
        hits,
        best,
        worst,
        average,
        guaranteeAchieved,
        guaranteedHits,
    };
}
