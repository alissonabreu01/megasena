'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DezenasSelector } from '@/components/DezenasSelector';
import { SimulationResultsTable } from '@/components/SimulationResultsTable';
import {
    TestTube,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    BarChart3,
    DollarSign,
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ContestResult {
    contestNumber: number;
    drawnNumbers: number[];
    bestHits: number;
    worstHits: number;
    averageHits: number;
    guaranteeAchieved: boolean;
}

interface SimulationSummary {
    totalContestsTested: number;
    guaranteeSuccessRate: number;
    averageBestHits: number;
    averageWorstHits: number;
    distribution: { [hits: number]: number };
}

interface SimulationResponse {
    success: boolean;
    closingGames: number[][];
    statistics: {
        totalGames: number;
        totalCost: number;
        costPerGame: number;
        coverage: number;
        guaranteedHits: number;
        averageHitsPerGame: number;
    };
    results: ContestResult[];
    summary: SimulationSummary;
}

export default function SimuladorFechamentoPage() {
    // Configurações do Fechamento
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
    const [guaranteedHits, setGuaranteedHits] = useState(15);
    const [algorithm, setAlgorithm] = useState<'balanceado' | 'cobertura' | 'otimizado'>(
        'otimizado'
    );
    const [maxGames, setMaxGames] = useState(20);

    // Configurações da Simulação
    const [rangeType, setRangeType] = useState<'lastN' | 'range'>('lastN');
    const [lastN, setLastN] = useState(100);
    const [contestStart, setContestStart] = useState(1);
    const [contestEnd, setContestEnd] = useState(100);

    // Estado da simulação
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);

    const handleSimulate = async () => {
        if (selectedNumbers.length < 15) {
            setMessage({
                type: 'error',
                text: 'Selecione pelo menos 15 dezenas para simular.',
            });
            return;
        }

        setLoading(true);
        setMessage(null);
        setSimulationData(null);

        try {
            const body: any = {
                availableNumbers: selectedNumbers,
                fixedNumbers: fixedNumbers.length > 0 ? fixedNumbers : undefined,
                guaranteedHits,
                algorithm,
                maxGames,
            };

            if (rangeType === 'lastN') {
                body.lastN = lastN;
            } else {
                body.contestRange = {
                    start: contestStart,
                    end: contestEnd,
                };
            }

            const response = await fetch('/api/simulator/test-closing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSimulationData(data);
                setMessage({
                    type: 'success',
                    text: `Simulação concluída! ${data.summary.totalContestsTested} concursos testados.`,
                });
            } else {
                setMessage({
                    type: 'error',
                    text: data.error || 'Erro ao executar simulação.',
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Erro de conexão com o servidor.',
            });
        } finally {
            setLoading(false);
        }
    };

    // Preparar dados para gráficos
    const evolutionData = simulationData?.results.map(r => ({
        concurso: r.contestNumber.toString(),
        melhor: r.bestHits,
        pior: r.worstHits,
        média: parseFloat(r.averageHits.toFixed(1)),
    })) || [];

    const distributionData = simulationData
        ? Object.entries(simulationData.summary.distribution)
            .map(([hits, count]) => ({
                acertos: `${hits} acertos`,
                quantidade: count,
            }))
            .sort((a, b) => parseInt(a.acertos) - parseInt(b.acertos))
        : [];

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Cabeçalho */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <TestTube className="w-8 h-8 text-purple-600" />
                    Simulador de Fechamento
                </h1>
                <p className="text-gray-600 mt-2">
                    Teste configurações de fechamento com resultados históricos reais.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Painel de Configuração */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Configuração do Fechamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuração do Fechamento</CardTitle>
                            <CardDescription>
                                Defina os parâmetros do fechamento a ser testado
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Garantia de Acertos</Label>
                                    <Badge variant="outline">{guaranteedHits} pontos</Badge>
                                </div>
                                <Slider
                                    value={[guaranteedHits]}
                                    min={15}
                                    max={20}
                                    step={1}
                                    onValueChange={([v]) => setGuaranteedHits(v)}
                                />
                                <p className="text-xs text-gray-500">
                                    Garantia mínima desejada de acertos
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Algoritmo de Fechamento</Label>
                                <Select value={algorithm} onValueChange={(v: any) => setAlgorithm(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="otimizado">🎯 Otimizado</SelectItem>
                                        <SelectItem value="balanceado">⚖️ Balanceado</SelectItem>
                                        <SelectItem value="cobertura">📊 Cobertura Máxima</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Limite Máximo de Jogos</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={maxGames}
                                    onChange={e => setMaxGames(Number(e.target.value))}
                                />
                                <p className="text-xs text-gray-500">
                                    Custo estimado: R$ {(maxGames * 3).toFixed(2)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configuração da Simulação */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Range de Concursos</CardTitle>
                            <CardDescription>
                                Defina quais concursos históricos testar
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RadioGroup value={rangeType} onValueChange={(v: any) => setRangeType(v)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="lastN" id="lastN" />
                                    <Label htmlFor="lastN" className="cursor-pointer">
                                        Últimos N concursos
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="range" id="range" />
                                    <Label htmlFor="range" className="cursor-pointer">
                                        Range específico
                                    </Label>
                                </div>
                            </RadioGroup>

                            {rangeType === 'lastN' ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Quantidade de Concursos</Label>
                                        <Badge variant="outline">{lastN} concursos</Badge>
                                    </div>
                                    <Slider
                                        value={[lastN]}
                                        min={10}
                                        max={500}
                                        step={10}
                                        onValueChange={([v]) => setLastN(v)}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Início</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={contestStart}
                                            onChange={e => setContestStart(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fim</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={contestEnd}
                                            onChange={e => setContestEnd(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Botão de Simular */}
                    <Button
                        onClick={handleSimulate}
                        disabled={loading || selectedNumbers.length < 15}
                        className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg font-semibold"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Simulando...
                            </>
                        ) : (
                            <>
                                <TestTube className="w-5 h-5 mr-2" />
                                Simular Fechamento
                            </>
                        )}
                    </Button>

                    {message && (
                        <Alert
                            variant={message.type === 'error' ? 'destructive' : 'default'}
                            className={
                                message.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : ''
                            }
                        >
                            {message.type === 'error' && <AlertCircle className="h-4 w-4" />}
                            {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Área de Resultados */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Seleção de Dezenas */}
                    <DezenasSelector
                        selected={selectedNumbers}
                        onChange={setSelectedNumbers}
                        fixedNumbers={fixedNumbers}
                        disabled={loading}
                    />

                    {/* Resultados */}
                    {simulationData && (
                        <>
                            {/* Cards de Resumo */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardDescription>Taxa de Sucesso</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-green-600">
                                                {simulationData.summary.guaranteeSuccessRate.toFixed(1)}
                                            </span>
                                            <span className="text-lg text-gray-600">%</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardDescription>Média Melhor Jogo</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                            <span className="text-3xl font-bold text-blue-600">
                                                {simulationData.summary.averageBestHits.toFixed(1)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardDescription>Jogos Gerados</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-2">
                                            <BarChart3 className="w-5 h-5 text-purple-600" />
                                            <span className="text-3xl font-bold text-purple-600">
                                                {simulationData.statistics.totalGames}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardDescription>Custo Total</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-2">
                                            <DollarSign className="w-5 h-5 text-orange-600" />
                                            <span className="text-3xl font-bold text-orange-600">
                                                {simulationData.statistics.totalCost.toFixed(2)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Gráfico de Evolução */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Evolução dos Acertos</CardTitle>
                                    <CardDescription>
                                        Desempenho ao longo dos concursos testados
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={evolutionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="concurso"
                                                tick={{ fontSize: 12 }}
                                                interval="preserveStartEnd"
                                            />
                                            <YAxis domain={[0, 20]} />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="melhor"
                                                stroke="#16a34a"
                                                name="Melhor"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="média"
                                                stroke="#3b82f6"
                                                name="Média"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="pior"
                                                stroke="#ef4444"
                                                name="Pior"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Gráfico de Distribuição */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Distribuição de Acertos</CardTitle>
                                    <CardDescription>
                                        Frequência de cada quantidade de acertos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={distributionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="acertos" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="quantidade" fill="#9333ea" name="Ocorrências" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Tabela de Resultados */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Resultados Detalhados</CardTitle>
                                    <CardDescription>
                                        Desempenho em cada concurso testado
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <SimulationResultsTable
                                        results={simulationData.results}
                                        guaranteedHits={guaranteedHits}
                                    />
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
