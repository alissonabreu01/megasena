export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}

export function handleError(error: unknown) {
    if (error instanceof AppError) {
        return {
            message: error.message,
            statusCode: error.statusCode,
        };
    }

    console.error(error);

    return {
        message: 'Internal server error',
        statusCode: 500,
    };
}

export const ErrorMessages = {
    INVALID_INPUT: 'Dados de entrada inválidos',
    SERVER_ERROR: 'Erro interno do servidor',
    NOT_FOUND: 'Recurso não encontrado',
    UNAUTHORIZED: 'Não autorizado',
} as const;