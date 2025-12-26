'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award, Upload, Loader2, AlertCircle, CheckCircle, Trophy, Search, Calendar, Hash, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Contest {
    concurso: number;
    dataSorteio: string;
    bola01: number;
    bola02: number;
    bola03: number;
    bola04: number;
    bola05: number;
    bola06: number;
    bola07?: number;
    bola08?: number;
    bola09?: number;
    bola10?: number;
    bola11?: number;
    bola12?: number;
    bola13?: number;
    bola14?: number;
    bola15?: number;
    bola16?: number;
    bola17?: number;
    bola18?: number;
    bola19?: number;
    bola20?: number;
}

interface CheckResult {
    index: number;
    game: string[];
    gameNumbers: number[];
    hits: number[];
    hitCount: number;
    misses: number[];
    isPrized: boolean;
    prizeAmount: number;
}

interface PrizeInfo {
    faixa: number;
    descricao: string;
    numeroDeGanhadores: number;
    valorPremio: number;
}

interface FinancialSummary {
    betCost: number;
    totalCost: number;
    totalEarnings: number;
    profit: number;
    profitPercentage: number;
    isProfit: boolean;
}

interface CheckResponse {
    contest: {
        number: number;
        date: string;
        drawnNumbers: number[];
    };
    results: CheckResult[];
    prizes: PrizeInfo[];
    prizesError: string | null;
    summary: {
        totalGames: number;
        prizedCount: number;
        hitDistribution: { [key: number]: number };
    };
    financial: FinancialSummary;
    message: string;
}

export default function ConferidorPage() {
    const [gamesText, setGamesText] = useState('');
    const [contestNumber, setContestNumber] = useState('');
    const [contests, setContests] = useState<Contest[]>([]);
    const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingContests, setLoadingContests] = useState(true);
    const [results, setResults] = useState<CheckResponse | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Carregar últimos concursos ao montar
    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        setLoadingContests(true);
        try {
            const response = await fetch('/api/contests?limit=50');
            const data = await response.json();
            if (response.ok) {
                setContests(data.contests);
                // Selecionar o mais recente por padrão
                if (data.contests.length > 0) {
                    setSelectedContest(data.contests[0]);
                    setContestNumber(data.contests[0].concurso.toString());
                }
            }
        } catch (error) {
            console.error('Erro ao buscar concursos:', error);
        } finally {
            setLoadingContests(false);
        }
    };

    const handleContestSearch = () => {
        const num = parseInt(contestNumber);
        if (isNaN(num) || num <= 0) {
            setMessage({ type: 'error', text: 'Digite um número de concurso válido.' });
            return;
        }

        const found = contests.find(c => c.concurso === num);
        if (found) {
            setSelectedContest(found);
            setMessage({ type: 'success', text: `Concurso ${num} selecionado!` });
        } else {
            setMessage({ type: 'error', text: `Concurso ${num} não encontrado. Verifique se o número está correto ou atualize o banco de dados.` });
        }
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setGamesText(content);
                setMessage({ type: 'success', text: 'Arquivo importado com sucesso!' });
            };
            reader.readAsText(file);
        }
    };

    const handleConferir = async () => {
        if (!selectedContest) {
            setMessage({ type: 'error', text: 'Selecione um concurso para conferir.' });
            return;
        }

        if (!gamesText.trim()) {
            setMessage({ type: 'error', text: 'Digite ou importe os jogos para conferir.' });
            return;
        }

        setLoading(true);
        setMessage(null);
        setResults(null);

        try {
            const games = gamesText
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.trim().split(/\s+/).map(n => n.padStart(2, '0')));

            if (games.length === 0) {
                setMessage({ type: 'error', text: 'Nenhum jogo válido encontrado.' });
                setLoading(false);
                return;
            }

            const response = await fetch('/api/conferir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    games,
                    contestNumber: selectedContest.concurso
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResults(data);
                setMessage({ type: 'success', text: data.message });
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao conferir jogos.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão ao conferir os jogos.' });
        } finally {
            setLoading(false);
        }
    };

    const getDrawnNumbers = (contest: Contest): number[] => {
        return [
            contest.bola01, contest.bola02, contest.bola03, contest.bola04, contest.bola05,
            contest.bola06, contest.bola07, contest.bola08, contest.bola09, contest.bola10,
            contest.bola11, contest.bola12, contest.bola13, contest.bola14, contest.bola15,
            contest.bola16, contest.bola17, contest.bola18, contest.bola19, contest.bola20
        ].filter((num): num is number => num !== undefined && num !== null);
    };

    const getHitCountColor = (hitCount: number) => {
        if (hitCount === 20) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900';
        if (hitCount === 0) return 'bg-gradient-to-r from-pink-500 to-pink-600 text-white';
        if (hitCount === 19) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900';
        if (hitCount === 18) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
        if (hitCount >= 15) return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
        return 'bg-gray-200 text-gray-700';
    };

    const getPrizeLabel = (hitCount: number) => {
        switch (hitCount) {
            case 20: return '1º Prêmio - 20 acertos!';
            case 19: return '2º Prêmio - 19 acertos!';
            case 18: return '3º Prêmio - 18 acertos!';
            case 17: return '4º Prêmio - 17 acertos!';
            case 16: return '5º Prêmio - 16 acertos!';
            case 15: return '6º Prêmio - 15 acertos!';
            case 0: return '7º Prêmio - 0 acertos!';
            default: return null;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="w-8 h-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Conferidor de Apostas</h1>
                    </div>
                    <p className="text-gray-600">
                        Confira suas apostas da Lotomania a qualquer momento, mesmo quando o site da Caixa está indisponível.
                    </p>
                </div>

                {/* Message Alert */}
                {message && (
                    <Alert
                        className={`${message.type === 'success'
                            ? 'border-green-200 bg-green-50'
                            : message.type === 'error'
                                ? 'border-red-200 bg-red-50'
                                : 'border-blue-200 bg-blue-50'
                            }`}
                    >
                        {message.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna da Esquerda - Entrada */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Seleção de Concurso */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Hash className="w-5 h-5" />
                                    Selecionar Concurso
                                </CardTitle>
                                <CardDescription>
                                    Escolha o concurso que deseja conferir
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Número do concurso"
                                        value={contestNumber}
                                        onChange={(e) => setContestNumber(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleContestSearch()}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={handleContestSearch}
                                        disabled={loadingContests}
                                    >
                                        <Search className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Últimos concursos:</Label>
                                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                        {contests.slice(0, 20).map((contest) => (
                                            <Badge
                                                key={contest.concurso}
                                                variant={selectedContest?.concurso === contest.concurso ? "default" : "outline"}
                                                className={`cursor-pointer transition-all ${selectedContest?.concurso === contest.concurso
                                                    ? 'bg-purple-600 hover:bg-purple-700'
                                                    : 'hover:bg-purple-50'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedContest(contest);
                                                    setContestNumber(contest.concurso.toString());
                                                }}
                                            >
                                                {contest.concurso}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Resultado do concurso selecionado */}
                                {selectedContest && (
                                    <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-800">
                                                Concurso {selectedContest.concurso} - {selectedContest.dataSorteio}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {getDrawnNumbers(selectedContest).sort((a, b) => a - b).map((num) => (
                                                <Badge
                                                    key={num}
                                                    className="w-7 h-7 flex items-center justify-center text-xs bg-purple-600 hover:bg-purple-600"
                                                >
                                                    {num.toString().padStart(2, '0')}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Entrada de Jogos */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Seus Jogos</CardTitle>
                                <CardDescription>
                                    Digite seus jogos (6 números por linha) ou importe um arquivo .txt
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder="Exemplo:&#10;01 02 03 04 05 06 (6 números)&#10;..."
                                    value={gamesText}
                                    onChange={(e) => setGamesText(e.target.value)}
                                    rows={8}
                                    className="font-mono text-sm max-h-[500px] overflow-y-auto"
                                />

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleConferir}
                                        disabled={loading || !selectedContest || !gamesText.trim()}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Conferindo...
                                            </>
                                        ) : (
                                            <>
                                                <Award className="w-4 h-4 mr-2" />
                                                Conferir Jogos
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={loading}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Importar
                                    </Button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".txt"
                                        onChange={handleFileImport}
                                        className="hidden"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna da Direita - Resultados */}
                    <div className="lg:col-span-2 space-y-6">
                        {results ? (
                            <>
                                {/* Resumo Financeiro */}
                                <Card className={`border-2 ${results.financial.isProfit ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50' : results.financial.profit < 0 ? 'border-red-400 bg-gradient-to-r from-red-50 to-orange-50' : 'border-gray-300'}`}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2">
                                            <Wallet className="w-5 h-5" />
                                            Resumo Financeiro
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center p-3 rounded-lg bg-white/70">
                                                <div className="text-xs text-gray-500 mb-1">Investimento</div>
                                                <div className="text-lg font-bold text-gray-700">
                                                    {formatCurrency(results.financial.totalCost)}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    {results.summary.totalGames} jogos × {formatCurrency(results.financial.betCost)}
                                                </div>
                                            </div>

                                            <div className="text-center p-3 rounded-lg bg-white/70">
                                                <div className="text-xs text-gray-500 mb-1">Prêmios Ganhos</div>
                                                <div className={`text-lg font-bold ${results.financial.totalEarnings > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {formatCurrency(results.financial.totalEarnings)}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    {results.summary.prizedCount} jogo(s) premiado(s)
                                                </div>
                                            </div>

                                            <div className="text-center p-3 rounded-lg bg-white/70">
                                                <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                                                    {results.financial.isProfit ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                                                    Resultado
                                                </div>
                                                <div className={`text-xl font-bold ${results.financial.isProfit ? 'text-green-600' : results.financial.profit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {results.financial.profit >= 0 ? '+' : ''}{formatCurrency(results.financial.profit)}
                                                </div>
                                                <div className={`text-[10px] ${results.financial.isProfit ? 'text-green-500' : results.financial.profit < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {results.financial.profit >= 0 ? 'LUCRO' : 'PREJUÍZO'}
                                                </div>
                                            </div>

                                            <div className="text-center p-3 rounded-lg bg-white/70">
                                                <div className="text-xs text-gray-500 mb-1">Retorno</div>
                                                <div className={`text-lg font-bold ${results.financial.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {results.financial.profitPercentage >= 0 ? '+' : ''}{results.financial.profitPercentage.toFixed(1)}%
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    sobre investimento
                                                </div>
                                            </div>
                                        </div>

                                        {results.prizesError && (
                                            <Alert className="mt-3 border-yellow-200 bg-yellow-50">
                                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                <AlertDescription className="text-yellow-700 text-xs">
                                                    {results.prizesError}. Os valores de prêmios podem não estar disponíveis.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Tabela de Prêmios */}
                                {results.prizes && results.prizes.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <DollarSign className="w-5 h-5 text-green-500" />
                                                Premiação do Concurso {results.contest.number}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-7 gap-2">
                                                {results.prizes.map((prize) => {
                                                    // Calcular acertos: Faixa 1-6 = 20-15 acertos, Faixa 7 = 0 acertos
                                                    const hits = prize.faixa === 7 ? 0 : 21 - prize.faixa;
                                                    const myWins = results.summary.hitDistribution[hits] || 0;
                                                    return (
                                                        <div
                                                            key={prize.faixa}
                                                            className={`p-2 rounded-lg text-center border ${myWins > 0 ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                                                        >
                                                            <div className="text-xs font-medium text-gray-500">{hits} acertos</div>
                                                            <div className={`text-sm font-bold ${myWins > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                                                {formatCurrency(prize.valorPremio)}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400">
                                                                {prize.numeroDeGanhadores.toLocaleString('pt-BR')} ganhador(es)
                                                            </div>
                                                            {myWins > 0 && (
                                                                <Badge className="mt-1 text-[10px] bg-green-500">
                                                                    Você: {myWins}x
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Resumo de Acertos */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-gray-900">
                                                    {results.summary.totalGames}
                                                </div>
                                                <div className="text-sm text-gray-500">Total de Jogos</div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className={results.summary.prizedCount > 0 ? 'border-green-300 bg-green-50' : ''}>
                                        <CardContent className="pt-6">
                                            <div className="text-center">
                                                <div className={`text-3xl font-bold ${results.summary.prizedCount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                    {results.summary.prizedCount}
                                                </div>
                                                <div className="text-sm text-gray-500">Premiados (15+ ou 0)</div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-purple-600">
                                                    {Math.max(...results.results.map(r => r.hitCount))}
                                                </div>
                                                <div className="text-sm text-gray-500">Máximo de Acertos</div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-blue-600">
                                                    {(results.results.reduce((sum, r) => sum + r.hitCount, 0) / results.results.length).toFixed(1)}
                                                </div>
                                                <div className="text-sm text-gray-500">Média de Acertos</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Distribuição de Acertos */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Distribuição de Acertos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(results.summary.hitDistribution)
                                                .filter(([_, count]) => count > 0)
                                                .sort(([a], [b]) => Number(b) - Number(a))
                                                .map(([hits, count]) => (
                                                    <Badge
                                                        key={hits}
                                                        variant="outline"
                                                        className={`px-3 py-1 ${Number(hits) >= 15 || Number(hits) === 0 ? 'border-green-400 bg-green-50 text-green-700' : ''}`}
                                                    >
                                                        {hits} acertos: <span className="font-bold ml-1">{count}</span>
                                                    </Badge>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Lista de Resultados */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-yellow-500" />
                                            Resultados Detalhados
                                        </CardTitle>
                                        <CardDescription>
                                            Ordenado por quantidade de acertos (decrescente)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                            {results.results.map((result) => {
                                                const prizeLabel = getPrizeLabel(result.hitCount);
                                                const hitsSet = new Set(result.hits);

                                                return (
                                                    <div
                                                        key={result.index}
                                                        className={`p-4 rounded-lg border transition-all ${result.isPrized
                                                            ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50'
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-medium text-gray-500">
                                                                    Jogo #{result.index}
                                                                </span>
                                                                <Badge className={getHitCountColor(result.hitCount)}>
                                                                    {result.hitCount} acertos
                                                                </Badge>
                                                                {prizeLabel && (
                                                                    <Badge variant="outline" className="border-yellow-400 bg-yellow-50 text-yellow-700">
                                                                        <Trophy className="w-3 h-3 mr-1" />
                                                                        {prizeLabel}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {result.prizeAmount > 0 && (
                                                                <Badge className="bg-green-500 text-white">
                                                                    {formatCurrency(result.prizeAmount)}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap gap-1.5">
                                                            {result.gameNumbers
                                                                .filter(num => num != null)
                                                                .sort((a, b) => a - b)
                                                                .map((num) => {
                                                                    const isHit = hitsSet.has(num);
                                                                    return (
                                                                        <Badge
                                                                            key={num}
                                                                            variant={isHit ? "default" : "outline"}
                                                                            className={`w-8 h-8 flex items-center justify-center text-sm font-medium transition-all ${isHit
                                                                                ? 'bg-green-500 hover:bg-green-500 text-white shadow-sm'
                                                                                : 'bg-gray-100 text-gray-400 border-gray-200'
                                                                                }`}
                                                                        >
                                                                            {num.toString().padStart(2, '0')}
                                                                        </Badge>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <Card className="min-h-[400px] flex items-center justify-center">
                                <CardContent>
                                    <div className="text-center text-gray-400">
                                        <Award className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg">Nenhum resultado ainda</p>
                                        <p className="text-sm">Insira seus jogos e clique em "Conferir Jogos"</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
