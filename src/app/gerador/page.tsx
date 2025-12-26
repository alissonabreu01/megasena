'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, Download, CheckCircle, RefreshCw, Settings2, AlertCircle, ArrowRight, Save, FolderOpen, Trash2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Interface para configurações salvas
interface SavedConfig {
    id: string;
    name: string;
    createdAt: string;
    strategy: string;
    numGames: number;
    // Urgency params
    topNUrgency: number;
    useWeightedScore: boolean;
    urgencyWeightRatio: number;
    // Filters
    useEvenOddFilter: boolean;
    minEven: number;
    maxEven: number;
    useEvenMin: boolean;
    useEvenMax: boolean;
    useSumFilter: boolean;
    minSum: number;
    maxSum: number;
    useSumMin: boolean;
    useSumMax: boolean;
    useFrameFilter: boolean;
    minFrame: number;
    maxFrame: number;
    useFrameMin: boolean;
    useFrameMax: boolean;
    // Pattern params
    contestsToAnalyze: number;
}

// Interface para resposta da API de sugestões de filtros
interface FilterSuggestionsResponse {
    analysis: {
        contestsAnalyzed: number;
        evenOdd: { min: number; max: number; average: number; mostCommon: number };
        sum: { min: number; max: number; average: number };
        frame: { min: number; max: number; average: number; mostCommon: number };
    };
}

const STORAGE_KEY = 'loto_generator_configs';

// Funções de persistência
const loadConfigsFromStorage = (): SavedConfig[] => {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const saveConfigsToStorage = (configs: SavedConfig[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
};

export default function GeneratorPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(false);
    const [strategy, setStrategy] = useState('urgency');
    const [numGames, setNumGames] = useState(10);

    const [generatedGames, setGeneratedGames] = useState<{ numbers: number[]; metrics?: any; isMirror?: boolean }[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Urgency Strategy Params
    const [topNUrgency, setTopNUrgency] = useState(45);
    const [useWeightedScore, setUseWeightedScore] = useState(false); // Weighted score (Urgency + Frequency)
    const [urgencyWeightRatio, setUrgencyWeightRatio] = useState(60); // 60% Urgency, 40% Frequency

    // Individual Filter States
    const [useEvenOddFilter, setUseEvenOddFilter] = useState(false);
    const [minEven, setMinEven] = useState(2);
    const [maxEven, setMaxEven] = useState(4);
    const [useEvenMin, setUseEvenMin] = useState(true);
    const [useEvenMax, setUseEvenMax] = useState(true);

    const [useSumFilter, setUseSumFilter] = useState(false);
    const [minSum, setMinSum] = useState(100);
    const [maxSum, setMaxSum] = useState(250);
    const [useSumMin, setUseSumMin] = useState(true);
    const [useSumMax, setUseSumMax] = useState(true);

    const [useFrameFilter, setUseFrameFilter] = useState(false);
    const [minFrame, setMinFrame] = useState(2);
    const [maxFrame, setMaxFrame] = useState(4);
    const [useFrameMin, setUseFrameMin] = useState(true);
    const [useFrameMax, setUseFrameMax] = useState(true);

    // Pattern Strategy Params
    const [contestsToAnalyze, setContestsToAnalyze] = useState(100);

    // Config Management
    const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [configName, setConfigName] = useState('');

    // Auto-config States
    const [autoConfigLoading, setAutoConfigLoading] = useState(false);
    const [autoConfigContests, setAutoConfigContests] = useState(100);

    // Carregar configurações salvas ao iniciar
    useEffect(() => {
        const configs = loadConfigsFromStorage();
        setSavedConfigs(configs);
    }, []);

    // Função para salvar configuração atual
    const handleSaveConfig = () => {
        if (!configName.trim()) {
            setMessage({ type: 'error', text: 'Digite um nome para a configuração.' });
            return;
        }

        const newConfig: SavedConfig = {
            id: Date.now().toString(),
            name: configName.trim(),
            createdAt: new Date().toISOString(),
            strategy,
            numGames,
            topNUrgency,
            useWeightedScore,
            urgencyWeightRatio,
            useEvenOddFilter,
            minEven,
            maxEven,
            useEvenMin,
            useEvenMax,
            useSumFilter,
            minSum,
            maxSum,
            useSumMin,
            useSumMax,
            useFrameFilter,
            minFrame,
            maxFrame,
            useFrameMin,
            useFrameMax,
            contestsToAnalyze,
        };

        const updatedConfigs = [...savedConfigs, newConfig];
        setSavedConfigs(updatedConfigs);
        saveConfigsToStorage(updatedConfigs);
        setConfigName('');
        setShowSaveDialog(false);
        setMessage({ type: 'success', text: `Configuração "${newConfig.name}" salva com sucesso!` });
    };

    // Função para aplicar configuração
    const applyConfig = (config: SavedConfig) => {
        setStrategy(config.strategy);
        setNumGames(config.numGames);
        setTopNUrgency(config.topNUrgency);
        setUseWeightedScore(config.useWeightedScore);
        setUrgencyWeightRatio(config.urgencyWeightRatio);
        setUseEvenOddFilter(config.useEvenOddFilter);
        setMinEven(config.minEven);
        setMaxEven(config.maxEven);
        setUseEvenMin(config.useEvenMin ?? true);
        setUseEvenMax(config.useEvenMax ?? true);
        setUseSumFilter(config.useSumFilter);
        setMinSum(config.minSum);
        setMaxSum(config.maxSum);
        setUseSumMin(config.useSumMin ?? true);
        setUseSumMax(config.useSumMax ?? true);
        setUseFrameFilter(config.useFrameFilter);
        setMinFrame(config.minFrame);
        setMaxFrame(config.maxFrame);
        setUseFrameMin(config.useFrameMin ?? true);
        setUseFrameMax(config.useFrameMax ?? true);
        setContestsToAnalyze(config.contestsToAnalyze);
        setShowLoadDialog(false);
        setMessage({ type: 'success', text: `Configuração "${config.name}" carregada!` });
    };

    // Função para deletar configuração
    const deleteConfig = (id: string) => {
        const updatedConfigs = savedConfigs.filter(c => c.id !== id);
        setSavedConfigs(updatedConfigs);
        saveConfigsToStorage(updatedConfigs);
        setMessage({ type: 'info', text: 'Configuração removida.' });
    };

    // Função para auto-configurar filtros baseado em estatísticas
    const handleAutoConfig = async () => {
        setAutoConfigLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/filter-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contestsToAnalyze: autoConfigContests })
            });

            const data: FilterSuggestionsResponse = await response.json();

            if (response.ok) {
                // Aplicar sugestões aos filtros com fallback para valores padrão
                setMinEven(data.analysis.evenOdd.min ?? 2);
                setMaxEven(data.analysis.evenOdd.max ?? 4);
                setMinSum(data.analysis.sum.min ?? 100);
                setMaxSum(data.analysis.sum.max ?? 250);
                setMinFrame(data.analysis.frame.min ?? 2);
                setMaxFrame(data.analysis.frame.max ?? 4);

                // Ativar todos os filtros e seus limites min/max
                setUseEvenOddFilter(true);
                setUseEvenMin(true);
                setUseEvenMax(true);
                setUseSumFilter(true);
                setUseSumMin(true);
                setUseSumMax(true);
                setUseFrameFilter(true);
                setUseFrameMin(true);
                setUseFrameMax(true);

                setMessage({
                    type: 'success',
                    text: `Filtros configurados! Pares: ${data.analysis.evenOdd.min ?? 2}-${data.analysis.evenOdd.max ?? 4}, Soma: ${data.analysis.sum.min ?? 100}-${data.analysis.sum.max ?? 250}, Moldura: ${data.analysis.frame.min ?? 2}-${data.analysis.frame.max ?? 4}`
                });
            } else {
                setMessage({ type: 'error', text: 'Erro ao obter sugestões de filtros' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão ao analisar concursos' });
        } finally {
            setAutoConfigLoading(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setMessage(null);
        setGeneratedGames([]);

        try {
            let endpoint = '/api/games';
            let body: any = { strategy, numGames };

            if (strategy === 'urgency') {
                endpoint = '/api/generate-cycle-games';

                // Build filters object dynamically based on enabled filters
                const filters: any = {};

                if (useEvenOddFilter) {
                    filters.evenOdd = {
                        min: useEvenMin ? minEven : undefined,
                        max: useEvenMax ? maxEven : undefined
                    };
                }

                if (useSumFilter) {
                    filters.sum = {
                        min: useSumMin ? minSum : undefined,
                        max: useSumMax ? maxSum : undefined
                    };
                }

                if (useFrameFilter) {
                    filters.frame = {
                        min: useFrameMin ? minFrame : undefined,
                        max: useFrameMax ? maxFrame : undefined
                    };
                }

                body = {
                    numGames,
                    topNUrgency,
                    useWeightedScore,
                    weights: useWeightedScore ? {
                        urgency: urgencyWeightRatio / 100,
                        frequency: (100 - urgencyWeightRatio) / 100
                    } : undefined,
                    filters: Object.keys(filters).length > 0 ? filters : undefined
                };
            } else if (strategy === 'patternLoto') {
                endpoint = '/api/generate-pattern-games';
                body = {
                    numGames,
                    contestsToAnalyze
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                // Normalize game format (some APIs return strings, others numbers, others objects with metrics)
                const games = data.games.map((g: any) => {
                    if (Array.isArray(g)) {
                        return { numbers: g.map((n: any) => Number(n)), metrics: undefined };
                    } else {
                        return { numbers: g.numbers.map((n: any) => Number(n)), metrics: g.metrics };
                    }
                });

                setGeneratedGames(games);
                setMessage({ type: 'success', text: `${games.length} jogos gerados com sucesso!` });
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao gerar jogos' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (generatedGames.length === 0) return;
        const content = generatedGames.map(g => g.numbers.map(n => n.toString().padStart(2, '0')).join(' ')).join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `jogos_loto_${strategy}_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendToVerifier = () => {
        if (generatedGames.length === 0) {
            setMessage({ type: 'info', text: 'Nenhum jogo para enviar ao verificador.' });
            return;
        }

        // Formata os jogos para o formato esperado pelo verificador
        const gamesText = generatedGames
            .map(g => g.numbers.map(n => n.toString().padStart(2, '0')).join(' '))
            .join('\n');

        // Salva no localStorage para o verificador pegar
        localStorage.setItem('gamesFromGenerator', gamesText);

        // Navega para o verificador com transição suave
        startTransition(() => {
            router.push('/verificador');
        });
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gerador de Jogos</h1>
                    <p className="text-gray-600">Crie combinações otimizadas usando estatísticas avançadas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="w-5 h-5" />
                                Configuração
                            </CardTitle>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setShowSaveDialog(true)}
                                    title="Salvar configuração"
                                >
                                    <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setShowLoadDialog(true)}
                                    title="Carregar configuração"
                                >
                                    <FolderOpen className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <CardDescription>Defina os parâmetros para a geração.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Estratégia de Geração</Label>
                            <Select value={strategy} onValueChange={setStrategy}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="urgency">⚡ Score de Urgência (Recomendado)</SelectItem>
                                    <SelectItem value="patternLoto">🎯 Padrão Loto</SelectItem>
                                    <SelectItem value="random">🎲 Aleatório Simples</SelectItem>
                                    <SelectItem value="pattern">📊 Padrão do Último Jogo</SelectItem>
                                    <SelectItem value="mostFrequent">🔥 Mais Frequentes</SelectItem>
                                    <SelectItem value="leastFrequent">❄️ Menos Frequentes</SelectItem>
                                    <SelectItem value="cycleClosure">🔄 Fechamento de Ciclo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Quantidade de Jogos</Label>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={numGames}
                                onChange={(e) => setNumGames(Number(e.target.value))}
                            />
                        </div>



                        {strategy === 'urgency' && (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Pool de Dezenas (Top Urgência)</Label>
                                        <span className="text-xs text-muted-foreground">{topNUrgency} dezenas</span>
                                    </div>
                                    <Slider
                                        value={[topNUrgency]}
                                        min={15}
                                        max={60}
                                        step={1}
                                        onValueChange={([v]) => setTopNUrgency(v)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Seleciona as {topNUrgency} dezenas (de 60) com maior probabilidade baseada nos ciclos.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="weighted-score">Considerar Frequência Histórica</Label>
                                        <p className="text-xs text-muted-foreground">Equilibra urgência com frequência (Score Ponderado)</p>
                                    </div>
                                    <Switch id="weighted-score" checked={useWeightedScore} onCheckedChange={setUseWeightedScore} />
                                </div>

                                {useWeightedScore && (
                                    <div className="space-y-3 pt-2 pl-2 border-l-2 border-green-100 ml-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium text-blue-600">Frequência: {100 - urgencyWeightRatio}%</span>
                                            <span className="font-medium text-orange-600">Urgência: {urgencyWeightRatio}%</span>
                                        </div>
                                        <Slider
                                            value={[urgencyWeightRatio]}
                                            min={0}
                                            max={100}
                                            step={5}
                                            onValueChange={([v]) => setUrgencyWeightRatio(v)}
                                            className="py-2"
                                        />
                                        <p className="text-[10px] text-gray-500 text-center">
                                            {urgencyWeightRatio > 50 ? 'Priorizando números atrasados' : urgencyWeightRatio < 50 ? 'Priorizando números frequentes' : 'Balanço equilibrado'}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3 pt-4 border-t">
                                    {/* Auto-Configuração */}
                                    <div className="space-y-3 p-3 rounded-lg border border-dashed border-green-300 bg-gradient-to-r from-green-50 to-blue-50">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-green-600" />
                                            <Label className="text-sm font-semibold text-green-800">Auto-Configurar Filtros</Label>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            Analisa os últimos concursos e sugere valores para os filtros.
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">Concursos</span>
                                                    <span className="font-medium text-green-700">{autoConfigContests}</span>
                                                </div>
                                                <Slider
                                                    value={[autoConfigContests]}
                                                    min={10}
                                                    max={500}
                                                    step={10}
                                                    onValueChange={([v]) => setAutoConfigContests(v)}
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleAutoConfig}
                                                disabled={autoConfigLoading}
                                                className="border-green-300 hover:bg-green-100 hover:text-green-700"
                                            >
                                                {autoConfigLoading ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 mr-1" />
                                                        Sugerir
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <Label className="text-sm font-semibold">Filtros Estatísticos</Label>

                                    {/* Filtro de Pares */}
                                    <div className={`space-y-2 p-3 rounded-lg border transition-all ${useEvenOddFilter ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="even-odd-filter" className="text-sm font-medium">Pares (Min - Max)</Label>
                                            <Button
                                                variant={useEvenOddFilter ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setUseEvenOddFilter(!useEvenOddFilter)}
                                                className={useEvenOddFilter ? "bg-green-600 hover:bg-green-700 h-7 text-xs" : "h-7 text-xs"}
                                            >
                                                {useEvenOddFilter ? "Ativo" : "Inativo"}
                                            </Button>
                                        </div>
                                        {useEvenOddFilter && (
                                            <div className="space-y-2 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id="even-min-switch"
                                                        checked={useEvenMin}
                                                        onCheckedChange={setUseEvenMin}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                    <Label htmlFor="even-min-switch" className="text-xs text-gray-600">Mínimo</Label>
                                                    <Input
                                                        type="number"
                                                        value={minEven}
                                                        onChange={e => setMinEven(Number(e.target.value))}
                                                        className="h-8 flex-1"
                                                        min={0}
                                                        max={15}
                                                        disabled={!useEvenMin}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id="even-max-switch"
                                                        checked={useEvenMax}
                                                        onCheckedChange={setUseEvenMax}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                    <Label htmlFor="even-max-switch" className="text-xs text-gray-600">Máximo</Label>
                                                    <Input
                                                        type="number"
                                                        value={maxEven}
                                                        onChange={e => setMaxEven(Number(e.target.value))}
                                                        className="h-8 flex-1"
                                                        min={0}
                                                        max={15}
                                                        disabled={!useEvenMax}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Filtro de Soma */}
                                    <div className={`space-y-2 p-3 rounded-lg border transition-all ${useSumFilter ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="sum-filter" className="text-sm font-medium">Soma (Min - Max)</Label>
                                            <Button
                                                variant={useSumFilter ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setUseSumFilter(!useSumFilter)}
                                                className={useSumFilter ? "bg-green-600 hover:bg-green-700 h-7 text-xs" : "h-7 text-xs"}
                                            >
                                                {useSumFilter ? "Ativo" : "Inativo"}
                                            </Button>
                                        </div>
                                        {useSumFilter && (
                                            <div className="space-y-2 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id="sum-min-switch"
                                                        checked={useSumMin}
                                                        onCheckedChange={setUseSumMin}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                    <Label htmlFor="sum-min-switch" className="text-xs text-gray-600">Mínimo</Label>
                                                    <Input
                                                        type="number"
                                                        value={minSum}
                                                        onChange={e => setMinSum(Number(e.target.value))}
                                                        className="h-8 flex-1"
                                                        min={20}
                                                        max={350}
                                                        disabled={!useSumMin}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id="sum-max-switch"
                                                        checked={useSumMax}
                                                        onCheckedChange={setUseSumMax}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                    <Label htmlFor="sum-max-switch" className="text-xs text-gray-600">Máximo</Label>
                                                    <Input
                                                        type="number"
                                                        value={maxSum}
                                                        onChange={e => setMaxSum(Number(e.target.value))}
                                                        className="h-8 flex-1"
                                                        min={20}
                                                        max={350}
                                                        disabled={!useSumMax}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Filtro de Moldura */}
                                    <div className={`space-y-2 p-3 rounded-lg border transition-all ${useFrameFilter ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="frame-filter" className="text-sm font-medium">Dezenas na Moldura</Label>
                                            <Button
                                                variant={useFrameFilter ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setUseFrameFilter(!useFrameFilter)}
                                                className={useFrameFilter ? "bg-green-600 hover:bg-green-700 h-7 text-xs" : "h-7 text-xs"}
                                            >
                                                {useFrameFilter ? "Ativo" : "Inativo"}
                                            </Button>
                                        </div>
                                        {useFrameFilter && (
                                            <div className="space-y-2 pt-2">
                                                <p className="text-[10px] text-gray-500">
                                                    Moldura da Mega Sena (grid 6x10)
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id="frame-min-switch"
                                                        checked={useFrameMin}
                                                        onCheckedChange={setUseFrameMin}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                    <Label htmlFor="frame-min-switch" className="text-xs text-gray-600">Mínimo</Label>
                                                    <Input
                                                        type="number"
                                                        value={minFrame}
                                                        onChange={e => setMinFrame(Number(e.target.value))}
                                                        className="h-8 flex-1"
                                                        min={0}
                                                        max={15}
                                                        disabled={!useFrameMin}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id="frame-max-switch"
                                                        checked={useFrameMax}
                                                        onCheckedChange={setUseFrameMax}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                    <Label htmlFor="frame-max-switch" className="text-xs text-gray-600">Máximo</Label>
                                                    <Input
                                                        type="number"
                                                        value={maxFrame}
                                                        onChange={e => setMaxFrame(Number(e.target.value))}
                                                        className="h-8 flex-1"
                                                        min={0}
                                                        max={15}
                                                        disabled={!useFrameMax}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {strategy === 'patternLoto' && (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-xs text-blue-900 mb-2">
                                        <strong>🎯 Padrão Loto:</strong> Analisa os últimos concursos e identifica padrões comuns de:
                                    </p>
                                    <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                                        <li>Quantidade de pares/ímpares</li>
                                        <li>Números da moldura vs miolo</li>
                                        <li>Soma total das dezenas</li>
                                        <li>Distribuição por linhas</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Concursos para Análise</Label>
                                        <span className="text-xs text-muted-foreground">{contestsToAnalyze} concursos</span>
                                    </div>
                                    <Slider
                                        value={[contestsToAnalyze]}
                                        min={50}
                                        max={500}
                                        step={50}
                                        onValueChange={([v]) => setContestsToAnalyze(v)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Quanto mais concursos, mais preciso o padrão, mas menos flexível.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t space-y-4">
                            <Button onClick={handleGenerate} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold shadow-md transition-all hover:scale-[1.02]">
                                {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                                Gerar Jogos
                            </Button>
                        </div>

                        {message && (
                            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ''}>
                                {message.type === 'error' && <AlertCircle className="h-4 w-4" />}
                                {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
                                <AlertDescription>{message.text}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <Card className="lg:col-span-2 min-h-[500px]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Jogos Gerados</CardTitle>
                            <CardDescription>Visualize e exporte seus jogos.</CardDescription>
                        </div>
                        {generatedGames.length > 0 && (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleDownload}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Baixar .txt
                                </Button>
                                <Button
                                    onClick={handleSendToVerifier}
                                    disabled={isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isPending ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Carregando...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="w-4 h-4 mr-2" />
                                            Enviar para Verificador
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {generatedGames.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2">
                                {generatedGames.map((game, idx) => {
                                    const numbers = game.numbers;
                                    const sum = game.metrics?.sum ?? numbers.reduce((a, b) => a + b, 0);
                                    const evenCount = game.metrics?.evenCount ?? numbers.filter(n => n % 2 === 0).length;
                                    const avgScore = game.metrics?.avgScore;

                                    return (
                                        <div key={idx} className="p-3 border rounded-lg hover:border-green-300 transition-colors bg-white shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-gray-500">JOGO {idx + 1}</span>
                                                    {avgScore !== undefined && (
                                                        <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200">
                                                            Score: {avgScore}
                                                        </Badge>
                                                    )}
                                                    {game.isMirror && (
                                                        <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200">
                                                            Espelho
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 text-xs text-gray-400">
                                                    <span>Soma: {sum}</span>
                                                    <span>Pares: {evenCount}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {numbers.sort((a, b) => a - b).map(num => (
                                                    <Badge key={num} variant="secondary" className="w-8 h-8 flex items-center justify-center text-sm font-medium bg-gray-100 text-gray-900 hover:bg-green-100 hover:text-green-900">
                                                        {num.toString().padStart(2, '0')}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed rounded-lg">
                                <Zap className="w-12 h-12 mb-4 opacity-20" />
                                <p>Nenhum jogo gerado ainda.</p>
                                <p className="text-sm">Configure as opções e clique em "Gerar Jogos".</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog de Salvar Configuração */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Save className="w-5 h-5" />
                            Salvar Configuração
                        </DialogTitle>
                        <DialogDescription>
                            Salve a configuração atual para usar posteriormente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="config-name">Nome da Configuração</Label>
                            <Input
                                id="config-name"
                                placeholder="Ex: Minha estratégia favorita"
                                value={configName}
                                onChange={(e) => setConfigName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveConfig()}
                            />
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                            <p><strong>Será salvo:</strong></p>
                            <ul className="list-disc ml-4 space-y-0.5">
                                <li>Estratégia: {strategy === 'urgency' ? 'Score de Urgência' : strategy}</li>
                                <li>Pool de dezenas: {topNUrgency}</li>
                                <li>Filtros ativos: {[useEvenOddFilter && 'Pares', useSumFilter && 'Soma', useFrameFilter && 'Moldura'].filter(Boolean).join(', ') || 'Nenhum'}</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveConfig} className="bg-purple-600 hover:bg-purple-700">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Carregar Configuração */}
            <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5" />
                            Carregar Configuração
                        </DialogTitle>
                        <DialogDescription>
                            Selecione uma configuração salva para carregar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {savedConfigs.length > 0 ? (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {savedConfigs.map((config) => (
                                    <div
                                        key={config.id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:border-purple-300 hover:bg-purple-50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{config.name}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    {config.strategy === 'urgency' ? 'Urgência' : config.strategy}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    Pool: {config.topNUrgency}
                                                </Badge>
                                                {config.useEvenOddFilter && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 bg-purple-100">
                                                        Pares: {config.minEven}-{config.maxEven}
                                                    </Badge>
                                                )}
                                                {config.useSumFilter && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 bg-blue-100">
                                                        Soma: {config.minSum}-{config.maxSum}
                                                    </Badge>
                                                )}
                                                {config.useFrameFilter && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 bg-green-100">
                                                        Moldura: {config.minFrame}-{config.maxFrame}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Salvo em: {new Date(config.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => deleteConfig(config.id)}
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8 bg-purple-600 hover:bg-purple-700"
                                                onClick={() => applyConfig(config)}
                                            >
                                                Carregar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
                                <p className="text-sm">Nenhuma configuração salva.</p>
                                <p className="text-xs">Use o botão de salvar para criar uma.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
