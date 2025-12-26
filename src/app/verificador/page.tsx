'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertCircle, Upload, Loader2, Filter, ArrowUpDown, Download, Zap } from 'lucide-react';
import { formatDateForDisplay } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface CheckResult {
    game: string[];
    isDrawn: boolean;
    contest?: {
        concurso: number;
        dataSorteio: string;
    };
    quality?: {
        score: number;
        violations: string[];
        metrics: {
            evenCount: number;
            oddCount: number;
            molduraCount: number;
            mioloCount: number;
            sum: number;
            sequences: string[];
            primesCount: number;
            fibonacciCount: number;
            lines: number[];
            columns: number[];
            amplitude: number;
            repeatedCount?: number;
            consecutivePairs: number;
            consecutiveTrios: number;
        };
    };
}

export default function VerificadorPage() {
    const [checkerText, setCheckerText] = useState('');
    const [checkerResults, setCheckerResults] = useState<CheckResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedGames, setSelectedGames] = useState<number[]>([]);

    // Filters and Sorting
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterDrawn, setFilterDrawn] = useState('all');
    const [customTopN, setCustomTopN] = useState('');

    // Carregar jogos do gerador quando a página carregar
    useEffect(() => {
        const gamesFromGenerator = localStorage.getItem('gamesFromGenerator');
        if (gamesFromGenerator) {
            setCheckerText(gamesFromGenerator);
            setMessage({ type: 'info', text: `${gamesFromGenerator.split('\n').length} jogos importados do gerador. Clique em "Verificar Jogos" para analisar.` });
            // Limpa o localStorage após carregar
            localStorage.removeItem('gamesFromGenerator');
        }
    }, []);

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setCheckerText(content);
                setMessage({ type: 'success', text: 'Arquivo importado com sucesso!' });
            };
            reader.readAsText(file);
        }
    };

    const handleCheckGames = async () => {
        setMessage(null);
        setLoading(true);
        setCheckerResults([]);
        setSelectedGames([]);

        try {
            const games = checkerText
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.trim().split(/\s+/).map(n => n.padStart(2, '0')));

            if (games.length === 0) {
                setMessage({ type: 'error', text: 'Nenhum jogo para conferir.' });
                setLoading(false);
                return;
            }

            const response = await fetch('/api/check-games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ games }),
            });

            const data = await response.json();

            if (response.ok) {
                setCheckerResults(data.results);
                setMessage({ type: 'success', text: data.message });
            } else {
                setMessage({ type: 'error', text: data.error || 'Falha ao conferir os jogos.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de rede ao conferir os jogos.' });
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = useMemo(() => {
        let results = [...checkerResults];

        // Filter
        if (filterDrawn === 'drawn') {
            results = results.filter(r => r.isDrawn);
        } else if (filterDrawn === 'not_drawn') {
            results = results.filter(r => !r.isDrawn);
        }

        // Sort
        results.sort((a, b) => {
            const scoreA = a.quality?.score || 0;
            const scoreB = b.quality?.score || 0;
            return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
        });

        return results;
    }, [checkerResults, filterDrawn, sortOrder]);

    const drawnCount = checkerResults.filter(r => r.isDrawn).length;
    const notDrawnCount = checkerResults.filter(r => !r.isDrawn).length;

    // Funções de seleção
    const toggleGameSelection = (index: number) => {
        setSelectedGames(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const toggleSelectAll = () => {
        if (selectedGames.length === filteredResults.length) {
            setSelectedGames([]);
        } else {
            setSelectedGames(filteredResults.map((_, index) => index));
        }
    };

    const handleDownloadSelected = () => {
        if (selectedGames.length === 0) {
            setMessage({ type: 'info', text: 'Nenhum jogo selecionado para download.' });
            return;
        }

        const selectedGamesText = selectedGames
            .map(index => filteredResults[index])
            .filter(result => result && !result.isDrawn) // Apenas jogos não sorteados
            .map(result => result.game.join(' '))
            .join('\n');

        if (!selectedGamesText) {
            setMessage({ type: 'info', text: 'Nenhum jogo válido (não sorteado) selecionado para download.' });
            return;
        }

        const blob = new Blob([selectedGamesText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jogos_selecionados_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setMessage({ type: 'success', text: `${selectedGames.filter(i => !filteredResults[i]?.isDrawn).length} jogo(s) baixado(s) com sucesso!` });
    };

    // Funções de seleção rápida por score
    const selectTopN = (n: number) => {
        // Filtra apenas jogos não sorteados e pega os top N
        const notDrawnIndices = filteredResults
            .map((result, index) => ({ result, index }))
            .filter(item => !item.result.isDrawn)
            .slice(0, n)
            .map(item => item.index);

        setSelectedGames(notDrawnIndices);
        setMessage({ type: 'success', text: `Top ${n} jogos selecionados!` });
    };

    const selectCustomTopN = () => {
        const n = parseInt(customTopN);
        if (isNaN(n) || n <= 0) {
            setMessage({ type: 'error', text: 'Por favor, insira um número válido.' });
            return;
        }
        selectTopN(n);
        setCustomTopN(''); // Limpa o input após seleção
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Verificador de Jogos</h1>
                    </div>
                    <p className="text-gray-600">
                        Verifique se seus jogos já foram sorteados e analise a qualidade estatística completa.
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
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                {/* Input Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Inserir Jogos</CardTitle>
                        <CardDescription>
                            Digite seus jogos (6 números por linha, separados por espaço) ou importe um arquivo .txt
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Botões fixos no topo */}
                        <div className="flex gap-2 sticky top-0 bg-white py-2 z-10 border-b border-gray-100">
                            <Button onClick={handleCheckGames} disabled={loading || !checkerText.trim()}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Verificar Jogos
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Importar Arquivo
                            </Button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt"
                                onChange={handleFileImport}
                                className="hidden"
                            />
                        </div>

                        {/* Textarea com altura máxima e scroll */}
                        <Textarea
                            placeholder="Exemplo:&#10;01 02 03 04 05 06&#10;07 08 09 10 11 12&#10;13 14 15 16 17 18"
                            value={checkerText}
                            onChange={(e) => setCheckerText(e.target.value)}
                            className="font-mono max-h-[300px] min-h-[150px] overflow-y-auto resize-y"
                        />
                    </CardContent>
                </Card>

                {/* Results */}
                {checkerResults.length > 0 && (
                    <>
                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Total de Jogos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {checkerResults.length}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Já Sorteados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-red-600">
                                        {drawnCount}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Não Sorteados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-600">
                                        {notDrawnCount}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filters and Sorting */}
                        <div className="flex gap-4 flex-wrap items-center justify-between">
                            <div className="flex gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-500" />
                                    <Select value={filterDrawn} onValueChange={setFilterDrawn}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filtrar Sorteio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Jogos</SelectItem>
                                            <SelectItem value="drawn">Já Sorteados</SelectItem>
                                            <SelectItem value="not_drawn">Não Sorteados</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                                    <Select value={sortOrder} onValueChange={setSortOrder}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Ordenar por Score" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="desc">Maior Score</SelectItem>
                                            <SelectItem value="asc">Menor Score</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedGames.length > 0 && (
                                    <Badge variant="secondary" className="text-sm px-3 py-1">
                                        {selectedGames.length} selecionado(s)
                                    </Badge>
                                )}
                                <Button
                                    onClick={handleDownloadSelected}
                                    disabled={selectedGames.length === 0}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Baixar Selecionados
                                </Button>
                            </div>
                        </div>

                        {/* Seleção Rápida por Score */}
                        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-green-600" />
                                    <CardTitle className="text-lg">Seleção Rápida por Score</CardTitle>
                                </div>
                                <CardDescription>
                                    Selecione rapidamente os melhores jogos (não sorteados) de acordo com o score
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <Button
                                        onClick={() => selectTopN(10)}
                                        variant="outline"
                                        size="sm"
                                        className="border-green-300 hover:bg-green-100 hover:border-green-400"
                                        disabled={notDrawnCount === 0}
                                    >
                                        Top 10
                                    </Button>
                                    <Button
                                        onClick={() => selectTopN(20)}
                                        variant="outline"
                                        size="sm"
                                        className="border-green-300 hover:bg-green-100 hover:border-green-400"
                                        disabled={notDrawnCount === 0}
                                    >
                                        Top 20
                                    </Button>
                                    <Button
                                        onClick={() => selectTopN(50)}
                                        variant="outline"
                                        size="sm"
                                        className="border-green-300 hover:bg-green-100 hover:border-green-400"
                                        disabled={notDrawnCount === 0}
                                    >
                                        Top 50
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Ex: 100"
                                            value={customTopN}
                                            onChange={(e) => setCustomTopN(e.target.value)}
                                            className="w-24 h-9 border-green-300 focus:border-green-400"
                                            min="1"
                                            disabled={notDrawnCount === 0}
                                        />
                                        <Button
                                            onClick={selectCustomTopN}
                                            variant="outline"
                                            size="sm"
                                            className="border-green-300 hover:bg-green-100 hover:border-green-400"
                                            disabled={notDrawnCount === 0 || !customTopN}
                                        >
                                            Selecionar
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => selectTopN(notDrawnCount)}
                                        variant="outline"
                                        size="sm"
                                        className="border-green-300 hover:bg-green-100 hover:border-green-400"
                                        disabled={notDrawnCount === 0}
                                    >
                                        Todos ({notDrawnCount})
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Results Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Resultados Detalhados</CardTitle>
                                <CardDescription>
                                    Análise completa de cada jogo submetido.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectedGames.length === filteredResults.length && filteredResults.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead className="w-[250px]">Jogo</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Par/Ímp</TableHead>
                                            <TableHead>Mol/Mio</TableHead>
                                            <TableHead>Primos</TableHead>
                                            <TableHead>Fib</TableHead>
                                            <TableHead>Rep</TableHead>
                                            <TableHead>Soma</TableHead>
                                            <TableHead>Amp</TableHead>
                                            <TableHead>Seq</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredResults.map((result, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedGames.includes(index)}
                                                        onCheckedChange={() => toggleGameSelection(index)}
                                                        disabled={result.isDrawn}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {result.game.map((num, i) => (
                                                            <Badge key={i} variant="secondary" className="text-[10px] w-5 h-5 p-0 flex items-center justify-center">
                                                                {num}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {result.quality ? (
                                                        <div className="flex flex-col">
                                                            <span className={`font-bold ${result.quality.score >= 90 ? 'text-green-600' :
                                                                result.quality.score >= 70 ? 'text-blue-600' :
                                                                    result.quality.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                                }`}>
                                                                {result.quality.score}
                                                            </span>
                                                            {result.isDrawn && (
                                                                <span className="text-[9px] text-red-600 font-bold uppercase">
                                                                    Sorteado
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {result.quality?.metrics ? (
                                                        <div className="text-xs">
                                                            <span className="text-blue-600 font-medium">{result.quality.metrics.evenCount}P</span>
                                                            <span className="text-gray-300 mx-1">/</span>
                                                            <span className="text-orange-600 font-medium">{result.quality.metrics.oddCount}Í</span>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {result.quality?.metrics ? (
                                                        <div className="text-xs">
                                                            <span className="text-green-600 font-medium">{result.quality.metrics.molduraCount}M</span>
                                                            <span className="text-gray-300 mx-1">/</span>
                                                            <span className="text-indigo-600 font-medium">{result.quality.metrics.mioloCount}C</span>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs">{result.quality?.metrics?.primesCount ?? '-'}</TableCell>
                                                <TableCell className="text-xs">{result.quality?.metrics?.fibonacciCount ?? '-'}</TableCell>
                                                <TableCell className="text-xs font-bold text-gray-700">{result.quality?.metrics?.repeatedCount ?? '-'}</TableCell>
                                                <TableCell className="text-xs">{result.quality?.metrics?.sum ?? '-'}</TableCell>
                                                <TableCell className="text-xs">{result.quality?.metrics?.amplitude ?? '-'}</TableCell>
                                                <TableCell>
                                                    {result.quality?.metrics ? (
                                                        <div className="flex flex-col gap-1">
                                                            {result.quality.metrics.sequences && result.quality.metrics.sequences.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mb-1">
                                                                    {result.quality.metrics.sequences.map((seq, i) => (
                                                                        <Badge key={i} variant="outline" className="text-[9px] h-4 px-1 bg-gray-50">
                                                                            {seq}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="text-[10px] text-gray-500 flex gap-2">
                                                                <span>{result.quality.metrics.consecutivePairs} Pares</span>
                                                                <span>{result.quality.metrics.consecutiveTrios} Trios</span>
                                                            </div>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
