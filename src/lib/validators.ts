import { z } from 'zod';

export const GameInputSchema = z.object({
    strategy: z.string(),
    numGames: z.number().int().positive(),
});

export const GameAnalysisSchema = z.object({
    games: z.array(z.array(z.number())),
    analyses: z.array(z.string()),
});

export type GameInput = z.infer<typeof GameInputSchema>;
export type GameAnalysis = z.infer<typeof GameAnalysisSchema>;