'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Filter,
    Trash2,
    Download,
    Grid3x3,
    TrendingUp,
    Rows,
    Star,
    Zap,
    Info,
    Target,
    Sparkles
} from 'lucide-react';
import {
    getQuadrantNumbers,
    getLineNumbers,
    getColumnNumbers,
    getTwinNumbers,
    getPrimeNumbers,
    getEvenNumbers,
    getOddNumbers,
    generateMultipleGames,
    calculateGameSum,
    countEvens,
} from '@/lib/exclusion-utils';
import {
    gerarFechamento,
    calcularEstatisticasFechamento,
    type FechamentoResult,
} from '@/lib/fechamento-utils';

interface FrequencyClassification {
    hot: number[];
    medium: number[];
    cold: number[];
}

export default function ExclusionPage() {
    // Estados para controle de exclusões
    const [excludedNumbers, setExcludedNumbers] = useState<Set<number>>(new Set());
    const [fixedNumbers, setFixedNumbers] = useState<Set<number>>(new Set());

    // Estados para quadrantes
    const [excludedQuadrants, setExcludedQuadrants] = useState<Set<number>>(new Set());

    // Estados para análise de frequência
    const [frequencyData, setFrequencyData] = useState<FrequencyClassification | null>(null);
    const [contestsToAnalyze, setContestsToAnalyze] = useState(50);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [excludeHot, setExcludeHot] = useState(false);
    const [excludeCold, setExcludeCold] = useState(false);

    // Estados para linhas e colunas
    const [excludedLines, setExcludedLines] = useState<Set<number>>(new Set());
    const [excludedColumns, setExcludedColumns] = useState<Set<number>>(new Set());

    // Estados para filtros inteligentes
    const [excludeTwins, setExcludeTwins] = useState(false);
    const [excludePrimes, setExcludePrimes] = useState(false);
    const [onlyEven, setOnlyEven] = useState(false);
    const [onlyOdd, setOnlyOdd] = useState(false);

    // Estados para geração de jogos
    const [generatedGames, setGeneratedGames] = useState<number[][]>([]);
    const [numberOfGames, setNumberOfGames] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);

    // Input temporário para dezenas fixas
    const [fixedNumberInput, setFixedNumberInput] = useState('');

    // Estados para análise de quadrantes
    const [quadrantAnalysis, setQuadrantAnalysis] = useState<any>(null);
    const [isAnalyzingQuadrants, setIsAnalyzingQuadrants] = useState(false);
    const [quadrantContestsToAnalyze, setQuadrantContestsToAnalyze] = useState(50);

    // Estados para consulta de concurso por quadrante
    const [contestNumber, setContestNumber] = useState('');
    const [contestQuadrantData, setContestQuadrantData] = useState<any>(null);
    const [isLoadingContest, setIsLoadingContest] = useState(false);

    // Estados para Fechamento Inteligente
    const [fechamentoResult, setFechamentoResult] = useState<FechamentoResult | null>(null);
    const [isFechamentoGenerating, setIsFechamentoGenerating] = useState(false);
    const [garantiaAcertos, setGarantiaAcertos] = useState(18);
    const [algoritmoFechamento, setAlgoritmoFechamento] = useState<'balanceado' | 'cobertura' | 'otimizado'>('otimizado');

    // Calcula números totais excluídos baseado em todas as regras ativas
    const calculateTotalExclusions = (): Set<number> => {
        const excluded = new Set(excludedNumbers);

        // Adiciona quadrantes excluídos
        excludedQuadrants.forEach(q => {
            getQuadrantNumbers(q as 1 | 2 | 3 | 4).forEach(n => excluded.add(n));
        });

        // Adiciona linhas excluídas
        excludedLines.forEach(line => {
            getLineNumbers(line).forEach(n => excluded.add(n));
        });

        // Adiciona colunas excluídas
        excludedColumns.forEach(col => {
            getColumnNumbers(col).forEach(n => excluded.add(n));
        });

        // Adiciona números por frequência
        if (frequencyData && excludeHot) {
            frequencyData.hot.forEach(n => excluded.add(n));
        }
        if (frequencyData && excludeCold) {
            frequencyData.cold.forEach(n => excluded.add(n));
        }

        // Adiciona filtros especiais
        if (excludeTwins) {
            getTwinNumbers().forEach(n => excluded.add(n));
        }
        if (excludePrimes) {
            getPrimeNumbers().forEach(n => excluded.add(n));
        }
        if (onlyEven) {
            getOddNumbers().forEach(n => excluded.add(n));
        }
        if (onlyOdd) {
            getEvenNumbers().forEach(n => excluded.add(n));
        }

        // Remove números fixos das exclusões
        fixedNumbers.forEach(n => excluded.delete(n));

        return excluded;
    };

    const totalExclusions = calculateTotalExclusions();
    const availableNumbers = 100 - totalExclusions.size - fixedNumbers.size;

    // Função para análise de frequência
    const handleAnalyzeFrequency = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/exclusion/analyze-frequency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contestsToAnalyze }),
            });

            if (response.ok) {
                const data = await response.json();
                setFrequencyData(data.classification);
            }
        } catch (error) {
            console.error('Erro ao analisar frequência:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Função para adicionar dezena fixa
    const handleAddFixedNumber = () => {
        const num = parseInt(fixedNumberInput);
        if (!isNaN(num) && num >= 0 && num <= 99 && !fixedNumbers.has(num)) {
            if (fixedNumbers.size < 30) {
                setFixedNumbers(new Set([...fixedNumbers, num]));
                setFixedNumberInput('');
            }
        }
    };

    // Função para analisar quadrantes
    const handleAnalyzeQuadrants = async () => {
        setIsAnalyzingQuadrants(true);
        try {
            const response = await fetch('/api/exclusion/analyze-quadrants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contestsToAnalyze: quadrantContestsToAnalyze }),
            });

            if (response.ok) {
                const data = await response.json();
                setQuadrantAnalysis(data);
            }
        } catch (error) {
            console.error('Erro ao analisar quadrantes:', error);
        } finally {
            setIsAnalyzingQuadrants(false);
        }
    };

    // Função para buscar concurso específico
    const handleSearchContest = async () => {
        if (!contestNumber || isNaN(parseInt(contestNumber))) {
            alert('Digite um número de concurso válido');
            return;
        }

        setIsLoadingContest(true);
        try {
            const response = await fetch('/api/exclusion/contest-quadrants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contestNumber: parseInt(contestNumber) }),
            });

            if (response.ok) {
                const data = await response.json();
                setContestQuadrantData(data);
            } else {
                alert('Concurso não encontrado');
                setContestQuadrantData(null);
            }
        } catch (error) {
            console.error('Erro ao buscar concurso:', error);
            alert('Erro ao buscar concurso');
        } finally {
            setIsLoadingContest(false);
        }
    };

    // Função para gerar Fechamento Inteligente
    const handleGerarFechamento = () => {
        const availableNums = Array.from({ length: 100 }, (_, i) => i).filter(
            n => !totalExclusions.has(n)
        );

        if (availableNums.length < 50) {
            alert('Você precisa ter pelo menos 50 dezenas disponíveis para gerar fechamento!');
            return;
        }

        setIsFechamentoGenerating(true);

        setTimeout(() => {
            try {
                const result = gerarFechamento(
                    {
                        availableNumbers: availableNums,
                        fixedNumbers: Array.from(fixedNumbers),
                        guaranteedHits: garantiaAcertos,
                        maxGames: 50,
                    },
                    algoritmoFechamento
                );

                setFechamentoResult(result);
                setGeneratedGames(result.games);
            } catch (error: any) {
                alert(error.message || 'Erro ao gerar fechamento');
            } finally {
                setIsFechamentoGenerating(false);
            }
        }, 100);
    };

    // Função para gerar jogos
    const handleGenerateGames = () => {
        if (availableNumbers + fixedNumbers.size < 50) {
            alert('Não há números suficientes disponíveis para gerar jogos de 50 dezenas!');
            return;
        }

        setIsGenerating(true);

        setTimeout(() => {
            const games = generateMultipleGames(
                numberOfGames,
                Array.from(totalExclusions),
                Array.from(fixedNumbers),
                {}
            );

            setGeneratedGames(games);
            setIsGenerating(false);
        }, 100);
    };

    // Função para limpar tudo
    const handleClearAll = () => {
        setExcludedNumbers(new Set());
        setFixedNumbers(new Set());
        setExcludedQuadrants(new Set());
        setExcludedLines(new Set());
        setExcludedColumns(new Set());
        setExcludeTwins(false);
        setExcludePrimes(false);
        setOnlyEven(false);
        setOnlyOdd(false);
        setExcludeHot(false);
        setExcludeCold(false);
        setGeneratedGames([]);
    };

    // Função para exportar jogos
    const handleExportGames = () => {
        if (generatedGames.length === 0) return;

        const content = generatedGames
            .map((game, idx) => `Jogo ${idx + 1}: ${game.map(n => n.toString().padStart(2, '0')).join(' ')}`)
            .join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jogos-exclusao.txt';
        a.click();
    };

    // Toggle de quadrante
    const toggleQuadrant = (q: number) => {
        const newSet = new Set(excludedQuadrants);
        if (newSet.has(q)) {
            newSet.delete(q);
        } else {
            newSet.add(q);
        }
        setExcludedQuadrants(newSet);
    };

    // Toggle de linha
    const toggleLine = (line: number) => {
        const newSet = new Set(excludedLines);
        if (newSet.has(line)) {
            newSet.delete(line);
        } else {
            newSet.add(line);
        }
        setExcludedLines(newSet);
    };

    // Toggle de coluna
    const toggleColumn = (col: number) => {
        const newSet = new Set(excludedColumns);
        if (newSet.has(col)) {
            newSet.delete(col);
        } else {
            newSet.add(col);
        }
        setExcludedColumns(newSet);
    };

    // Renderiza a matriz 10x10
    const renderMatrix = () => {
        const matrix: React.ReactNode[] = [];
        for (let row = 0; row < 10; row++) {
            const rowNumbers: React.ReactNode[] = [];
            for (let col = 0; col < 10; col++) {
                const num = row * 10 + col;
                const isExcluded = totalExclusions.has(num);
                const isFixed = fixedNumbers.has(num);

                rowNumbers.push(
                    <button
                        key={num}
                        onClick={() => {
                            if (isFixed) {
                                const newFixed = new Set(fixedNumbers);
                                newFixed.delete(num);
                                setFixedNumbers(newFixed);
                            } else if (isExcluded) {
                                const newExcluded = new Set(excludedNumbers);
                                newExcluded.delete(num);
                                setExcludedNumbers(newExcluded);
                            } else {
                                const newExcluded = new Set(excludedNumbers);
                                newExcluded.add(num);
                                setExcludedNumbers(newExcluded);
                            }
                        }}
                        className={`
                            w-10 h-10 text-xs font-semibold rounded border transition-all
                            ${isFixed
                                ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
                                : isExcluded
                                    ? 'bg-red-100 text-red-400 border-red-200 line-through'
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            }
                        `}
                    >
                        {num.toString().padStart(2, '0')}
                    </button>
                );
            }
            matrix.push(
                <div key={row} className="flex gap-1">
                    {rowNumbers}
                </div>
            );
        }
        return matrix;
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Filter className="w-8 h-8" />
                    Sistema de Exclusão de Dezenas
                </h1>
                <p className="text-gray-600 mt-2">
                    Aplique diferentes estratégias para reduzir e otimizar suas apostas
                </p>
            </div>

            {/* Resumo */}
            <Card className="mb-6 border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-purple-700">{100 - totalExclusions.size}</div>
                            <div className="text-sm text-gray-600">Dezenas Disponíveis</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">{totalExclusions.size}</div>
                            <div className="text-sm text-gray-600">Dezenas Excluídas</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600">{fixedNumbers.size}</div>
                            <div className="text-sm text-gray-600">Dezenas Fixas</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">{generatedGames.length}</div>
                            <div className="text-sm text-gray-600">Jogos Gerados</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna da esquerda - Matriz */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Grid3x3 className="w-5 h-5" />
                                Matriz 10x10
                            </CardTitle>
                            <CardDescription>
                                Clique nos números para excluir/incluir manualmente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {renderMatrix()}
                            </div>
                            <div className="mt-4 space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                                    <span>Disponível</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                                    <span>Excluída</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
                                    <span>Fixa (obrigatória)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna do meio - Métodos de Exclusão */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Métodos de Exclusão</CardTitle>
                            <CardDescription>Escolha as estratégias para filtrar suas apostas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="quadrants" className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="quadrants">Quadrantes</TabsTrigger>
                                    <TabsTrigger value="quadrant-analysis">Análise Q.</TabsTrigger>
                                    <TabsTrigger value="frequency">Frequência</TabsTrigger>
                                    <TabsTrigger value="lines">Linhas/Cols</TabsTrigger>
                                    <TabsTrigger value="filters">Filtros</TabsTrigger>
                                </TabsList>

                                {/* Tab Quadrantes */}
                                <TabsContent value="quadrants" className="space-y-4">
                                    <Alert>
                                        <Info className="w-4 h-4" />
                                        <AlertDescription>
                                            A matriz 10×10 pode ser dividida em 4 quadrantes com 25 dezenas cada.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(q => (
                                            <Button
                                                key={q}
                                                variant={excludedQuadrants.has(q) ? "destructive" : "outline"}
                                                onClick={() => toggleQuadrant(q)}
                                                className="h-20"
                                            >
                                                <div className="text-center">
                                                    <div className="font-bold">Quadrante {q}</div>
                                                    <div className="text-xs mt-1">
                                                        {q === 1 && "00-04, 10-14, ... 40-44"}
                                                        {q === 2 && "05-09, 15-19, ... 45-49"}
                                                        {q === 3 && "50-54, 60-64, ... 90-94"}
                                                        {q === 4 && "55-59, 65-69, ... 95-99"}
                                                    </div>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* Tab Análise de Quadrantes */}
                                <TabsContent value="quadrant-analysis" className="space-y-4">
                                    <Alert>
                                        <Info className="w-4 h-4" />
                                        <AlertDescription>
                                            Visualize quadrantes quentes/frios e consulte concursos específicos.
                                        </AlertDescription>
                                    </Alert>

                                    {/* Análise de Frequência */}
                                    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5" />
                                                Frequência por Quadrante
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <Label>Concursos para Analisar</Label>
                                                    <Input
                                                        type="number"
                                                        min="10"
                                                        max="100"
                                                        value={quadrantContestsToAnalyze}
                                                        onChange={(e) => setQuadrantContestsToAnalyze(parseInt(e.target.value) || 50)}
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button onClick={handleAnalyzeQuadrants} disabled={isAnalyzingQuadrants}>
                                                        {isAnalyzingQuadrants ? 'Analisando...' : 'Analisar'}
                                                    </Button>
                                                </div>
                                            </div>

                                            {quadrantAnalysis && (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {quadrantAnalysis.analysis.map((q: any, idx: number) => {
                                                            const isHot = quadrantAnalysis.classification.hot.includes(q.quadrant);
                                                            const isCold = quadrantAnalysis.classification.cold.includes(q.quadrant);

                                                            return (
                                                                <div
                                                                    key={q.quadrant}
                                                                    className={`p-4 rounded-lg border-2 ${isHot
                                                                        ? 'bg-red-50 border-red-300'
                                                                        : isCold
                                                                            ? 'bg-blue-50 border-blue-300'
                                                                            : 'bg-gray-50 border-gray-300'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="font-bold text-lg">
                                                                            Quadrante {q.quadrant}
                                                                        </span>
                                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${isHot
                                                                            ? 'bg-red-200 text-red-800'
                                                                            : isCold
                                                                                ? 'bg-blue-200 text-blue-800'
                                                                                : 'bg-gray-200 text-gray-800'
                                                                            }`}>
                                                                            {isHot ? '🔥 QUENTE' : isCold ? '❄️ FRIO' : '➡️ MÉDIO'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-1 text-sm">
                                                                        <div>
                                                                            <strong>Aparições:</strong> {q.frequency}
                                                                        </div>
                                                                        <div>
                                                                            <strong>Percentual:</strong> {q.percentage.toFixed(1)}%
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 mt-2">
                                                                            Esperado: {quadrantAnalysis.summary.expectedPerQuadrant.toFixed(0)} aparições
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="text-xs text-gray-600 text-center pt-2 border-t">
                                                        Análise baseada nos últimos {quadrantAnalysis.contestsAnalyzed} concursos
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Consulta de Concurso Específico */}
                                    <Card className="bg-gradient-to-br from-green-50 to-teal-50">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Grid3x3 className="w-5 h-5" />
                                                Consultar Concurso por Quadrante
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <Label>Número do Concurso</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Ex: 2750"
                                                        value={contestNumber}
                                                        onChange={(e) => setContestNumber(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSearchContest()}
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button onClick={handleSearchContest} disabled={isLoadingContest}>
                                                        {isLoadingContest ? 'Buscando...' : 'Buscar'}
                                                    </Button>
                                                </div>
                                            </div>

                                            {contestQuadrantData && (
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-white rounded border">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <strong>Concurso:</strong> {contestQuadrantData.contest.number}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {contestQuadrantData.contest.date}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        {contestQuadrantData.quadrants.map((q: any) => (
                                                            <div
                                                                key={q.quadrant}
                                                                className={`p-4 rounded-lg border-2 ${q.count >= 6
                                                                    ? 'bg-red-50 border-red-300'
                                                                    : q.count <= 3
                                                                        ? 'bg-blue-50 border-blue-300'
                                                                        : 'bg-gray-50 border-gray-300'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="font-bold">Q{q.quadrant}</span>
                                                                    <span className="text-sm font-semibold">
                                                                        {q.count} dezenas
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {q.numbers.map((num: number) => (
                                                                        <span
                                                                            key={num}
                                                                            className="px-2 py-1 bg-green-600 text-white rounded text-xs font-mono font-semibold"
                                                                        >
                                                                            {num.toString().padStart(2, '0')}
                                                                        </span>
                                                                    ))}
                                                                    {q.count === 0 && (
                                                                        <span className="text-xs text-gray-500 italic">
                                                                            Nenhuma dezena
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Tab Frequência */}
                                <TabsContent value="frequency" className="space-y-4">
                                    <Alert>
                                        <Info className="w-4 h-4" />
                                        <AlertDescription>
                                            Analise a frequência das dezenas nos últimos concursos.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Label>Concursos para Analisar</Label>
                                            <Input
                                                type="number"
                                                min="10"
                                                max="100"
                                                value={contestsToAnalyze}
                                                onChange={(e) => setContestsToAnalyze(parseInt(e.target.value) || 50)}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button onClick={handleAnalyzeFrequency} disabled={isAnalyzing}>
                                                {isAnalyzing ? 'Analisando...' : 'Analisar'}
                                            </Button>
                                        </div>
                                    </div>

                                    {frequencyData && (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-red-50 rounded border border-red-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-red-700">
                                                        Dezenas Quentes ({frequencyData.hot.length})
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant={excludeHot ? "destructive" : "outline"}
                                                        onClick={() => setExcludeHot(!excludeHot)}
                                                    >
                                                        {excludeHot ? 'Incluir' : 'Excluir'}
                                                    </Button>
                                                </div>
                                                <div className="text-sm text-gray-700">
                                                    {frequencyData.hot.map(n => n.toString().padStart(2, '0')).join(', ')}
                                                </div>
                                            </div>

                                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                                <span className="font-semibold text-blue-700">
                                                    Dezenas Médias ({frequencyData.medium.length})
                                                </span>
                                                <div className="text-sm text-gray-700 mt-2">
                                                    {frequencyData.medium.map(n => n.toString().padStart(2, '0')).join(', ')}
                                                </div>
                                            </div>

                                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-gray-700">
                                                        Dezenas Frias ({frequencyData.cold.length})
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant={excludeCold ? "destructive" : "outline"}
                                                        onClick={() => setExcludeCold(!excludeCold)}
                                                    >
                                                        {excludeCold ? 'Incluir' : 'Excluir'}
                                                    </Button>
                                                </div>
                                                <div className="text-sm text-gray-700">
                                                    {frequencyData.cold.map(n => n.toString().padStart(2, '0')).join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Tab Linhas/Colunas */}
                                <TabsContent value="lines" className="space-y-4">
                                    <Alert>
                                        <Info className="w-4 h-4" />
                                        <AlertDescription>
                                            Exclua linhas ou colunas inteiras da matriz.
                                        </AlertDescription>
                                    </Alert>

                                    <div>
                                        <Label className="mb-2 block font-semibold">Linhas</Label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(line => (
                                                <Button
                                                    key={line}
                                                    size="sm"
                                                    variant={excludedLines.has(line) ? "destructive" : "outline"}
                                                    onClick={() => toggleLine(line)}
                                                >
                                                    {line}0-{line}9
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-2 block font-semibold">Colunas (Terminação)</Label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => (
                                                <Button
                                                    key={col}
                                                    size="sm"
                                                    variant={excludedColumns.has(col) ? "destructive" : "outline"}
                                                    onClick={() => toggleColumn(col)}
                                                >
                                                    X{col}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Tab Filtros */}
                                <TabsContent value="filters" className="space-y-4">
                                    <Alert>
                                        <Info className="w-4 h-4" />
                                        <AlertDescription>
                                            Aplique filtros inteligentes para refinar ainda mais.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 border rounded">
                                            <span>Excluir Números Gêmeos (11, 22, 33...)</span>
                                            <Button
                                                size="sm"
                                                variant={excludeTwins ? "destructive" : "outline"}
                                                onClick={() => setExcludeTwins(!excludeTwins)}
                                            >
                                                {excludeTwins ? 'Ativo' : 'Inativo'}
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 border rounded">
                                            <span>Excluir Números Primos</span>
                                            <Button
                                                size="sm"
                                                variant={excludePrimes ? "destructive" : "outline"}
                                                onClick={() => setExcludePrimes(!excludePrimes)}
                                            >
                                                {excludePrimes ? 'Ativo' : 'Inativo'}
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 border rounded">
                                            <span>Apenas Números Pares</span>
                                            <Button
                                                size="sm"
                                                variant={onlyEven ? "default" : "outline"}
                                                onClick={() => {
                                                    setOnlyEven(!onlyEven);
                                                    if (!onlyEven) setOnlyOdd(false);
                                                }}
                                            >
                                                {onlyEven ? 'Ativo' : 'Inativo'}
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 border rounded">
                                            <span>Apenas Números Ímpares</span>
                                            <Button
                                                size="sm"
                                                variant={onlyOdd ? "default" : "outline"}
                                                onClick={() => {
                                                    setOnlyOdd(!onlyOdd);
                                                    if (!onlyOdd) setOnlyEven(false);
                                                }}
                                            >
                                                {onlyOdd ? 'Ativo' : 'Inativo'}
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Dezenas Fixas */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="w-5 h-5" />
                                Dezenas Fixas (Obrigatórias)
                            </CardTitle>
                            <CardDescription>
                                Adicione até 30 dezenas que estarão em todos os jogos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-3">
                                <Input
                                    type="number"
                                    min="0"
                                    max="99"
                                    placeholder="Ex: 15"
                                    value={fixedNumberInput}
                                    onChange={(e) => setFixedNumberInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddFixedNumber()}
                                />
                                <Button onClick={handleAddFixedNumber} disabled={fixedNumbers.size >= 30}>
                                    Adicionar
                                </Button>
                            </div>

                            {fixedNumbers.size > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(fixedNumbers).sort((a, b) => a - b).map(num => (
                                        <button
                                            key={num}
                                            onClick={() => {
                                                const newFixed = new Set(fixedNumbers);
                                                newFixed.delete(num);
                                                setFixedNumbers(newFixed);
                                            }}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                        >
                                            {num.toString().padStart(2, '0')} ×
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ações */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Ações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label>Quantidade de Jogos</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={numberOfGames}
                                        onChange={(e) => setNumberOfGames(parseInt(e.target.value) || 10)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleGenerateGames}
                                    disabled={isGenerating || availableNumbers + fixedNumbers.size < 50}
                                    className="flex-1"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    {isGenerating ? 'Gerando...' : 'Gerar Jogos'}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleClearAll}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Limpar Tudo
                                </Button>
                            </div>

                            {availableNumbers + fixedNumbers.size < 50 && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        Você precisa de pelo menos 50 dezenas disponíveis para gerar jogos!
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Fechamento Inteligente */}
                    <Card className="mt-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                Fechamento Inteligente
                            </CardTitle>
                            <CardDescription>
                                Gera o número ideal de jogos para garantir uma pontuação mínima
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert className="bg-white border-purple-300">
                                <Target className="w-4 h-4 text-purple-600" />
                                <AlertDescription>
                                    <strong>Como funciona:</strong> O fechamento inteligente analisa suas {100 - totalExclusions.size} dezenas disponíveis e gera o menor número de jogos possível para garantir o mínimo de acertos escolhido.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Garantia Mínima de Acertos</Label>
                                    <Input
                                        type="number"
                                        min="15"
                                        max="20"
                                        value={garantiaAcertos}
                                        onChange={(e) => setGarantiaAcertos(parseInt(e.target.value) || 18)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Entre 15 e 20 acertos
                                    </p>
                                </div>

                                <div>
                                    <Label>Algoritmo</Label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
                                        value={algoritmoFechamento}
                                        onChange={(e) => setAlgoritmoFechamento(e.target.value as any)}
                                    >
                                        <option value="otimizado">Otimizado (Recomendado)</option>
                                        <option value="balanceado">Balanceado</option>
                                        <option value="cobertura">Cobertura Máxima</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {algoritmoFechamento === 'otimizado' && 'Menor número de jogos'}
                                        {algoritmoFechamento === 'balanceado' && 'Distribuição equilibrada'}
                                        {algoritmoFechamento === 'cobertura' && 'Garante todas as dezenas'}
                                    </p>
                                </div>
                            </div>

                            {fechamentoResult && (
                                <div className="p-4 rounded-lg bg-white border-2 border-purple-300">
                                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Estatísticas do Fechamento
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="p-2 bg-purple-50 rounded">
                                            <div className="text-xs text-gray-600">Jogos Gerados</div>
                                            <div className="text-lg font-bold text-purple-700">
                                                {fechamentoResult.statistics.totalGames}
                                            </div>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded">
                                            <div className="text-xs text-gray-600">Custo Total</div>
                                            <div className="text-lg font-bold text-purple-700">
                                                R$ {fechamentoResult.statistics.totalCost.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded">
                                            <div className="text-xs text-gray-600">Cobertura</div>
                                            <div className="text-lg font-bold text-purple-700">
                                                {fechamentoResult.statistics.coverage.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded">
                                            <div className="text-xs text-gray-600">Garantia</div>
                                            <div className="text-lg font-bold text-green-600">
                                                {fechamentoResult.statistics.guaranteedHits} acertos
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={handleGerarFechamento}
                                disabled={isFechamentoGenerating || availableNumbers < 50}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                {isFechamentoGenerating ? 'Gerando Fechamento...' : 'Gerar Fechamento Inteligente'}
                            </Button>

                            {availableNumbers < 50 && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        Você precisa de pelo menos 50 dezenas disponíveis!
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Jogos Gerados */}
            {generatedGames.length > 0 && (
                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Jogos Gerados ({generatedGames.length})</CardTitle>
                            <Button onClick={handleExportGames}>
                                <Download className="w-4 h-4 mr-2" />
                                Exportar TXT
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {generatedGames.map((game, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-sm">Jogo {idx + 1}</span>
                                        <div className="text-xs text-gray-600">
                                            Soma: {calculateGameSum(game)} | Pares: {countEvens(game)}
                                        </div>
                                    </div>
                                    <div className="text-sm font-mono">
                                        {game.map(n => n.toString().padStart(2, '0')).join(' ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
