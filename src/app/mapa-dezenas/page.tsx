'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Map } from 'lucide-react';

interface Contest {
    concurso: number;
    numbers: number[];
}

export default function MapaDezenas() {
    const [loading, setLoading] = useState(true);
    const [contests, setContests] = useState<Contest[]>([]);
    const [displayCount, setDisplayCount] = useState(30);

    useEffect(() => {
        const fetchContests = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/contests');
                const data = await response.json();

                if (data.contests) {
                    // Pega os últimos concursos e formata
                    const formattedContests = data.contests.slice(-100).reverse().map((c: any) => ({
                        concurso: c.concurso,
                        numbers: [
                            c.bola01, c.bola02, c.bola03, c.bola04, c.bola05,
                            c.bola06, c.bola07, c.bola08, c.bola09, c.bola10,
                            c.bola11, c.bola12, c.bola13, c.bola14, c.bola15,
                            c.bola16, c.bola17, c.bola18, c.bola19, c.bola20
                        ]
                    }));
                    setContests(formattedContests);
                }
            } catch (error) {
                console.error('Error fetching contests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContests();
    }, []);

    const handleDisplayCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Permite digitação livre
        if (value === '') {
            setDisplayCount(10);
            return;
        }

        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            // Remove validação de limites aqui, apenas aceita o valor
            setDisplayCount(numValue);
        }
    };

    const handleDisplayCountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // Valida apenas quando sai do campo
        const value = e.target.value;

        if (value === '' || isNaN(Number(value))) {
            setDisplayCount(30);
            return;
        }

        const numValue = parseInt(value, 10);
        const clampedValue = Math.max(10, Math.min(100, numValue));
        setDisplayCount(clampedValue);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    const displayedContests = contests.slice(0, displayCount);

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Map className="w-8 h-8 text-green-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Mapa das Dezenas</h1>
                    </div>
                    <p className="text-gray-600">
                        Visualize quais dezenas foram sorteadas em cada concurso
                    </p>
                </div>
                <div className="w-full md:w-auto space-y-1">
                    <Label htmlFor="display-count">Quantidade de Concursos (10-100)</Label>
                    <Input
                        id="display-count"
                        type="number"
                        min={10}
                        max={100}
                        value={displayCount}
                        onChange={handleDisplayCountChange}
                        onBlur={handleDisplayCountBlur}
                        className="w-full md:w-[200px]"
                    />
                    <p className="text-xs text-gray-500">Mostrando {displayedContests.length} de {contests.length} concursos</p>
                </div>
            </div>

            {/* Legend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Legenda</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500 rounded border-2 border-green-600"></div>
                            <span className="text-sm">Dezena Sorteada</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded border border-gray-300"></div>
                            <span className="text-sm">Dezena Não Sorteada</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Map Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Mapa de Frequência</CardTitle>
                    <CardDescription>
                        Mostrando os últimos {displayedContests.length} concursos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full">
                            {/* Header - Dezenas */}
                            <div className="flex mb-1">
                                <div className="w-20 flex-shrink-0 font-bold text-center py-2 text-sm bg-green-600 text-white sticky left-0 z-10">
                                    Concurso
                                </div>
                                {Array.from({ length: 100 }, (_, i) => i).map(num => (
                                    <div
                                        key={num}
                                        className="w-8 flex-shrink-0 text-center font-bold text-xs py-2 bg-green-100 text-green-900"
                                    >
                                        {String(num).padStart(2, '0')}
                                    </div>
                                ))}
                                <div className="w-20 flex-shrink-0 font-bold text-center py-2 text-sm bg-green-600 text-white sticky right-0 z-10">
                                    Concurso
                                </div>
                            </div>

                            {/* Rows - Concursos */}
                            <div className="space-y-0.5">
                                {displayedContests.map((contest, idx) => (
                                    <div key={contest.concurso} className="flex">
                                        {/* Contest number - left */}
                                        <div className="w-20 flex-shrink-0 font-semibold text-center py-2 text-xs bg-green-600 text-white sticky left-0 z-10">
                                            {contest.concurso}
                                        </div>

                                        {/* Dezenas grid */}
                                        {Array.from({ length: 100 }, (_, i) => i).map(num => {
                                            const isDrawn = contest.numbers.includes(num);
                                            return (
                                                <div
                                                    key={num}
                                                    className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-xs font-medium border transition-colors ${isDrawn
                                                        ? 'bg-green-500 text-white border-green-600 font-bold'
                                                        : 'bg-gray-50 text-gray-400 border-gray-200'
                                                        }`}
                                                    title={`Concurso ${contest.concurso} - Dezena ${String(num).padStart(2, '0')}${isDrawn ? ' (Sorteada)' : ''}`}
                                                >
                                                    {isDrawn ? String(num).padStart(2, '0') : ''}
                                                </div>
                                            );
                                        })}

                                        {/* Contest number - right */}
                                        <div className="w-20 flex-shrink-0 font-semibold text-center py-2 text-xs bg-green-600 text-white sticky right-0 z-10">
                                            {contest.concurso}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total de Concursos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {displayedContests.length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Concurso Mais Recente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            {displayedContests[0]?.concurso || '-'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Concurso Mais Antigo (no mapa)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {displayedContests[displayedContests.length - 1]?.concurso || '-'}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
