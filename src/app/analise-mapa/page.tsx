'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, Flame, Snowflake, Target, BarChart3, Clock, Copy, CheckCircle, Zap } from 'lucide-react';

interface DezenaAnalysis {
    number: number;
    frequency: number;
    frequencyPercent: number;
    delay: number;
    lastContest: number;
    avgDelay: number;
    maxDelay: number;
    trend: 'hot' | 'cold' | 'neutral';
}

interface RecentItem {
    number: number;
    frequency: number;
}

interface AnalysisData {
    contestsAnalyzed: number;
    latestContest: number;
    dezenas: DezenaAnalysis[];
    overdue: DezenaAnalysis[];
    mostFrequent: DezenaAnalysis[];
    hotNumbers: number[];
    coldNumbers: number[];
    suggestedNumbers: number[];
    recentAnalysis: {
        contests: number;
        hot: RecentItem[];
        cold: RecentItem[];
    };
}

export default function AnaliseMapaPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalysisData | null>(null);
    const [contestsToAnalyze, setContestsToAnalyze] = useState(100);
    const [copied, setCopied] = useState(false);

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/analise-mapa?contests=${contestsToAnalyze}`);
            const result = await response.json();
            if (response.ok) {
                setData(result);
            }
        } catch (error) {
            console.error('Erro ao buscar análise:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, []);

    const handleAnalyze = () => {
        fetchAnalysis();
    };

    const copyToClipboard = (numbers: number[]) => {
        const text = numbers.map(n => String(n).padStart(2, '0')).join(' ');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getDelayColor = (delay: number, avgDelay: number) => {
        if (delay >= avgDelay * 2) return 'text-red-600 font-bold';
        if (delay > avgDelay) return 'text-orange-500';
        if (delay === 0) return 'text-green-600';
        return 'text-gray-600';
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'hot': return <Flame className="w-4 h-4 text-orange-500" />;
            case 'cold': return <Snowflake className="w-4 h-4 text-blue-500" />;
            default: return <span className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="container mx-auto p-6">
                <Alert className="border-red-200 bg-red-50">
                    <AlertDescription>Erro ao carregar análise</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-8 h-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Análise do Mapa</h1>
                    </div>
                    <p className="text-gray-600">
                        Análise estatística baseada nos padrões do mapa de dezenas
                    </p>
                </div>
                <div className="flex items-end gap-2">
                    <div className="space-y-1">
                        <Label htmlFor="contests">Concursos para analisar</Label>
                        <Input
                            id="contests"
                            type="number"
                            min={10}
                            max={500}
                            value={contestsToAnalyze}
                            onChange={(e) => setContestsToAnalyze(parseInt(e.target.value) || 100)}
                            className="w-32"
                        />
                    </div>
                    <Button onClick={handleAnalyze} className="bg-purple-600 hover:bg-purple-700">
                        <Zap className="w-4 h-4 mr-2" />
                        Analisar
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">{data.contestsAnalyzed}</div>
                            <div className="text-sm text-gray-500">Concursos Analisados</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{data.latestContest}</div>
                            <div className="text-sm text-gray-500">Último Concurso</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-orange-300 bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Flame className="w-6 h-6 text-orange-500" />
                                <span className="text-3xl font-bold text-orange-600">{data.hotNumbers.length}</span>
                            </div>
                            <div className="text-sm text-orange-700">Dezenas Quentes</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-300 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Snowflake className="w-6 h-6 text-blue-500" />
                                <span className="text-3xl font-bold text-blue-600">{data.coldNumbers.length}</span>
                            </div>
                            <div className="text-sm text-blue-700">Dezenas Frias</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sugestão de Jogo */}
            <Card className="border-2 border-purple-400 bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        Sugestão de Jogo
                    </CardTitle>
                    <CardDescription>
                        Baseado na análise de atraso, frequência e tendências dos últimos {data.contestsAnalyzed} concursos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {data.suggestedNumbers.map(num => (
                            <Badge
                                key={num}
                                className="w-10 h-10 flex items-center justify-center text-lg font-bold bg-purple-600 hover:bg-purple-700"
                            >
                                {String(num).padStart(2, '0')}
                            </Badge>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => copyToClipboard(data.suggestedNumbers)}
                        className="w-full md:w-auto"
                    >
                        {copied ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar Jogo
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dezenas Atrasadas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-red-500" />
                            Dezenas Mais Atrasadas
                        </CardTitle>
                        <CardDescription>
                            Números que estão &quot;devendo&quot; aparecer
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.overdue.map(d => (
                                <div key={d.number} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <Badge className="w-8 h-8 flex items-center justify-center font-bold bg-red-500">
                                            {String(d.number).padStart(2, '0')}
                                        </Badge>
                                        <div>
                                            <span className={`font-medium ${getDelayColor(d.delay, d.avgDelay)}`}>
                                                {d.delay} concurso(s) sem sair
                                            </span>
                                            <p className="text-xs text-gray-500">
                                                Média de atraso: {d.avgDelay.toFixed(1)} | Máximo: {d.maxDelay}
                                            </p>
                                        </div>
                                    </div>
                                    {getTrendIcon(d.trend)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Dezenas Mais Frequentes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Dezenas Mais Frequentes
                        </CardTitle>
                        <CardDescription>
                            Números que mais saem no período analisado
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.mostFrequent.map(d => (
                                <div key={d.number} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <Badge className="w-8 h-8 flex items-center justify-center font-bold bg-green-500">
                                            {String(d.number).padStart(2, '0')}
                                        </Badge>
                                        <div>
                                            <span className="font-medium text-green-700">
                                                {d.frequency}x ({d.frequencyPercent.toFixed(1)}%)
                                            </span>
                                            <p className="text-xs text-gray-500">
                                                Atraso atual: {d.delay} | Último: {d.lastContest}
                                            </p>
                                        </div>
                                    </div>
                                    {getTrendIcon(d.trend)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Análise Recente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-orange-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            Quentes nos Últimos 10 Concursos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {data.recentAnalysis.hot.map(item => (
                                <Badge
                                    key={item.number}
                                    variant="outline"
                                    className="px-3 py-2 border-orange-400 bg-orange-50"
                                >
                                    <span className="font-bold mr-2">
                                        {String(item.number).padStart(2, '0')}
                                    </span>
                                    <span className="text-orange-600">{item.frequency}x</span>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Snowflake className="w-5 h-5 text-blue-500" />
                            Frias nos Últimos 10 Concursos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {data.recentAnalysis.cold.map(item => (
                                <Badge
                                    key={item.number}
                                    variant="outline"
                                    className="px-3 py-2 border-blue-400 bg-blue-50"
                                >
                                    <span className="font-bold mr-2">
                                        {String(item.number).padStart(2, '0')}
                                    </span>
                                    <span className="text-blue-600">{item.frequency}x</span>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela Completa de Dezenas */}
            <Card>
                <CardHeader>
                    <CardTitle>Análise Completa das 25 Dezenas</CardTitle>
                    <CardDescription>
                        Estatísticas detalhadas de cada número
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="text-left p-2">Dezena</th>
                                    <th className="text-center p-2">Frequência</th>
                                    <th className="text-center p-2">%</th>
                                    <th className="text-center p-2">Atraso Atual</th>
                                    <th className="text-center p-2">Atraso Médio</th>
                                    <th className="text-center p-2">Atraso Máximo</th>
                                    <th className="text-center p-2">Tendência</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.dezenas.sort((a, b) => a.number - b.number).map(d => (
                                    <tr key={d.number} className="border-b hover:bg-gray-50">
                                        <td className="p-2">
                                            <Badge className={`w-8 h-8 flex items-center justify-center font-bold ${d.trend === 'hot' ? 'bg-orange-500' :
                                                    d.trend === 'cold' ? 'bg-blue-500' : 'bg-gray-500'
                                                }`}>
                                                {String(d.number).padStart(2, '0')}
                                            </Badge>
                                        </td>
                                        <td className="text-center p-2 font-medium">{d.frequency}</td>
                                        <td className="text-center p-2">{d.frequencyPercent.toFixed(1)}%</td>
                                        <td className={`text-center p-2 ${getDelayColor(d.delay, d.avgDelay)}`}>
                                            {d.delay}
                                        </td>
                                        <td className="text-center p-2">{d.avgDelay.toFixed(1)}</td>
                                        <td className="text-center p-2">{d.maxDelay}</td>
                                        <td className="text-center p-2">
                                            <div className="flex items-center justify-center gap-1">
                                                {getTrendIcon(d.trend)}
                                                <span className={`text-xs ${d.trend === 'hot' ? 'text-orange-600' :
                                                        d.trend === 'cold' ? 'text-blue-600' : 'text-gray-500'
                                                    }`}>
                                                    {d.trend === 'hot' ? 'Quente' : d.trend === 'cold' ? 'Fria' : 'Neutra'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Legenda */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Como Interpretar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-red-500 mt-0.5" />
                        <p><strong>Atraso:</strong> Quantos concursos se passaram desde que o número saiu pela última vez. Atrasos acima da média podem indicar que o número está &quot;devendo&quot;.</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                        <p><strong>Frequência:</strong> Quantas vezes o número apareceu no período analisado. Na Lotofácil, a frequência esperada é ~60% (15 de 25 números por sorteio).</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <Flame className="w-4 h-4 text-orange-500 mt-0.5" />
                        <p><strong>Quente:</strong> Número que está saindo com frequência alta e aparece nos últimos concursos.</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <Snowflake className="w-4 h-4 text-blue-500 mt-0.5" />
                        <p><strong>Fria:</strong> Número com atraso significativo acima da média, indicando que não sai há algum tempo.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
