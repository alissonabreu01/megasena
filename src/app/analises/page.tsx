'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Loader2, TrendingUp, Activity, Hash, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function AnalysisPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [cycleData, setCycleData] = useState<any>(null);
    const [fullCycleData, setFullCycleData] = useState<any>(null);
    const [selectionMode, setSelectionMode] = useState<string>('all');
    const [customCount, setCustomCount] = useState<string>('');

    // Calculate effective contest count for API
    const contestCount = selectionMode === 'custom' ? customCount : selectionMode;
    const [debouncedContestCount, setDebouncedContestCount] = useState<string>(contestCount);

    // Debounce logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedContestCount(contestCount);
        }, 800); // Wait 800ms after last keystroke

        return () => {
            clearTimeout(handler);
        };
    }, [contestCount]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const globalStatsUrl = `/api/analysis/global-stats${debouncedContestCount !== 'all' ? `?concursoCount=${debouncedContestCount}` : ''}`;

                const [globalStatsResponse, cycleStatsResponse, fullCycleResponse] = await Promise.all([
                    fetch(globalStatsUrl),
                    fetch('/api/ciclos?type=cycleStats'),
                    fetch('/api/ciclos?type=fullCycleAnalysis')
                ]);

                const globalStatsResult = await globalStatsResponse.json();
                const cycleStatsResult = await cycleStatsResponse.json();
                const fullCycleResult = await fullCycleResponse.json();

                if (globalStatsResult.data) {
                    setData(globalStatsResult.data);
                }
                if (cycleStatsResult.data) {
                    setCycleData(cycleStatsResult.data);
                }
                if (fullCycleResult.data) {
                    setFullCycleData(fullCycleResult.data);
                }

            } catch (error) {
                console.error('Failed to fetch analysis data', error);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if we have a valid count or if it's 'all'
        if (debouncedContestCount === 'all' || (parseInt(debouncedContestCount) > 0)) {
            fetchData();
        }
    }, [debouncedContestCount]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    if (!data) {
        return <div className="container mx-auto p-6">Erro ao carregar dados.</div>;
    }

    // Transform data for charts
    const totalContests = data.totalContests;

    const numbersData = Object.entries(data.numbers)
        .map(([num, count]) => ({
            name: num,
            value: count,
            percentage: ((count as number) / totalContests * 100).toFixed(1)
        }))
        .sort((a, b) => (b.value as number) - (a.value as number));

    const totalEvenOdd = Object.values(data.evenOdd).reduce((sum: number, val) => sum + (val as number), 0);
    const evenOddData = Object.entries(data.evenOdd)
        .map(([name, value]) => ({
            name,
            value,
            percentage: ((value as number) / totalEvenOdd * 100).toFixed(1)
        }))
        .sort((a, b) => b.name.localeCompare(a.name));

    const totalSum = Object.values(data.sum).reduce((sum: number, val) => sum + (val as number), 0);
    const sumData = Object.entries(data.sum)
        .map(([name, value]) => ({
            name,
            value,
            percentage: ((value as number) / totalSum * 100).toFixed(1)
        }));

    const totalFrame = Object.values(data.frame).reduce((sum: number, val) => sum + (val as number), 0);
    const frameData = Object.entries(data.frame)
        .map(([name, value]) => ({
            name: `${name} na Moldura`,
            value,
            percentage: ((value as number) / totalFrame * 100).toFixed(1)
        }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));

    // Custom label render function to show percentages
    const renderCustomLabel = (props: any) => {
        const { x, y, width, height, value, percentage } = props;
        const radius = 10;

        return (
            <text
                x={x + width / 2}
                y={y - radius}
                fill="#666"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={600}
            >
                {percentage}%
            </text>
        );
    };

    const renderCustomLabelHorizontal = (props: any) => {
        const { x, y, width, height, value, percentage } = props;

        return (
            <text
                x={x + width + 5}
                y={y + height / 2}
                fill="#666"
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={600}
            >
                {percentage}%
            </text>
        );
    };

    const urgencyData = cycleData ? Object.entries(cycleData)
        .map(([num, stats]: [string, any]) => ({ name: num, value: stats.urgencyScore, currentCycle: stats.currentCycle }))
        .sort((a, b) => b.value - a.value) : [];

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Análise Estatística</h1>
                    <p className="text-gray-600">
                        {contestCount !== 'all' ? `Análise baseada nos últimos ${contestCount} concursos.` : `Análise baseada em todos os ${data.totalContests} concursos.`}
                    </p>
                </div>
                <div className="w-full md:w-auto space-y-2">
                    <Label>Período da Análise</Label>
                    <div className="flex gap-2">
                        <Select value={selectionMode} onValueChange={setSelectionMode}>
                            <SelectTrigger className="w-full md:w-[220px]">
                                <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os concursos</SelectItem>
                                <SelectItem value="10">Últimos 10 concursos</SelectItem>
                                <SelectItem value="50">Últimos 50 concursos</SelectItem>
                                <SelectItem value="100">Últimos 100 concursos</SelectItem>
                                <SelectItem value="500">Últimos 500 concursos</SelectItem>
                                <SelectItem value="custom">Quantidade personalizada</SelectItem>
                            </SelectContent>
                        </Select>
                        {selectionMode === 'custom' && (
                            <Input
                                type="number"
                                min={1}
                                max={data?.totalContests || 10000}
                                placeholder="Ex: 200"
                                className="w-[120px]"
                                value={customCount}
                                onChange={(e) => setCustomCount(e.target.value)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dezena Mais Frequente</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">#{numbersData[0]?.name}</div>
                        <p className="text-xs text-muted-foreground">Saiu {String(numbersData[0]?.value)} vezes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dezena Menos Frequente</CardTitle>
                        <Activity className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">#{numbersData[numbersData.length - 1]?.name}</div>
                        <p className="text-xs text-muted-foreground">Saiu {String(numbersData[numbersData.length - 1]?.value)} vezes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Padrão Mais Comum</CardTitle>
                        <Hash className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.entries(data.evenOdd).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0]}
                        </div>
                        <p className="text-xs text-muted-foreground">Pares / Ímpares</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Média da Soma</CardTitle>
                        <Target className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">~{data.averageSum}</div>
                        <p className="text-xs text-muted-foreground">Média histórica</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Number Frequency Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Frequência das Dezenas</CardTitle>
                        <CardDescription>Quantidade de vezes que cada número foi sorteado.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={numbersData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: number, name: string, props: any) => [`${value} vezes (${props.payload.percentage}%)`, "Frequência"]}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                    {numbersData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 5 ? '#22c55e' : index > 19 ? '#ef4444' : '#8884d8'} />
                                    ))}
                                    <LabelList dataKey="percentage" content={renderCustomLabel} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Urgency Score Chart */}
                {urgencyData.length > 0 && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Score de Urgência</CardTitle>
                            <CardDescription>Quão "atrasada" cada dezena está, baseado em seu ciclo histórico (Z-score).</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={urgencyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number, name: string, props: any) => [`${value.toFixed(2)} (Atraso: ${props.payload.currentCycle})`, "Score"]}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Legend formatter={() => "Score de Urgência"} />
                                    <Bar dataKey="value" name="Score de Urgência" fill="#6d28d9" radius={[4, 4, 0, 0]}>
                                        {urgencyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.value > 1.5 ? '#ef4444' : entry.value > 1 ? '#f97316' : '#6d28d9'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Even/Odd Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pares e Ímpares</CardTitle>
                        <CardDescription>Distribuição dos padrões de paridade.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={evenOddData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} vezes (${props.payload.percentage}%)`, "Frequência"]} />
                                <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]}>
                                    <LabelList dataKey="percentage" content={renderCustomLabelHorizontal} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sum Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Soma das Dezenas</CardTitle>
                        <CardDescription>Frequência das faixas de soma.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sumData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} vezes (${props.payload.percentage}%)`, "Frequência"]} />
                                <Bar dataKey="value" fill="#ffc658" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="percentage" content={renderCustomLabel} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Frame Distribution */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Números na Moldura</CardTitle>
                        <CardDescription>Quantidade de números sorteados na borda do cartão.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={frameData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} vezes (${props.payload.percentage}%)`, "Frequência"]} />
                                <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="percentage" content={renderCustomLabel} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Cycle Analysis Section */}
            {fullCycleData && (
                <>
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Análise de Ciclos</h2>
                        <p className="text-gray-600 mb-6">
                            Um ciclo é o período necessário para que todas as 60 dezenas da Mega Sena apareçam pelo menos uma vez.
                        </p>
                    </div>

                    {/* Cycle Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Ciclos Encerrados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">
                                    {fullCycleData.totalCompletedCycles}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total de ciclos completos
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Ciclo Atual
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">
                                    {fullCycleData.currentCycleDuration}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Concursos no ciclo atual
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Média de Ciclo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-indigo-600">
                                    {fullCycleData.averageCycleDuration}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Concursos em média
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Ciclo Mais Longo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-orange-600">
                                    {fullCycleData.longestCycle}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Máximo de concursos
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Ciclo Mais Curto
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">
                                    {fullCycleData.shortestCycle}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Mínimo de concursos
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Início do Ciclo Atual
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-teal-600">
                                    {fullCycleData.currentCycleStartContest}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Número do concurso
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Missing Numbers Card */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Dezenas Faltantes para Fechar o Ciclo Atual</CardTitle>
                            <CardDescription>
                                {fullCycleData.missingNumbers.length > 0
                                    ? `Faltam ${fullCycleData.missingNumbers.length} dezena(s) para completar o ciclo atual`
                                    : 'Ciclo completo! Todas as dezenas já apareceram.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {fullCycleData.missingNumbers.length > 0 ? (
                                    fullCycleData.missingNumbers.map((num: number) => (
                                        <div
                                            key={num}
                                            className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 text-red-700 font-bold text-lg border-2 border-red-300"
                                        >
                                            {String(num).padStart(2, '0')}
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full text-center py-8 text-green-600 font-semibold">
                                        ✓ Ciclo atual está completo!
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Numbers in Current Cycle Card */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Dezenas que Já Apareceram no Ciclo Atual</CardTitle>
                            <CardDescription>
                                {fullCycleData.numbersInCurrentCycle.length} dezena(s) já foram sorteadas no ciclo atual
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {fullCycleData.numbersInCurrentCycle.map((num: number) => (
                                    <div
                                        key={num}
                                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 text-green-700 font-bold text-lg border-2 border-green-300"
                                    >
                                        {String(num).padStart(2, '0')}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

