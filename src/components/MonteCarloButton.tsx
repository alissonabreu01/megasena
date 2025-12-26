'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

export function MonteCarloButton() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/monte-carlo');
            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Análise de Monte Carlo Concluída',
                    description: `Probabilidade de Jogo Equilibrado: ${(data.probabilityOfBalanced * 100).toFixed(2)}%`,
                });
            } else {
                throw new Error(data.error || 'Falha ao analisar');
            }
        } catch (error) {
            toast({
                title: 'Erro na Análise',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analisando...' : 'Rodar Análise de Monte Carlo'}
        </Button>
    );
}
