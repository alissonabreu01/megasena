'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, RotateCcw, Shuffle, Grid3x3 } from 'lucide-react';
import { MEGASENA_CONFIG } from '@/lib/megasena-constants';

interface DezenaSelectorProps {
    selected: number[];
    onChange: (selected: number[]) => void;
    fixedNumbers?: number[];
    disabled?: boolean;
    maxSelection?: number;
}

export function DezenasSelector({
    selected,
    onChange,
    fixedNumbers = [],
    disabled = false,
    maxSelection,
}: DezenaSelectorProps) {
    // Mega Sena: números de 1 a 60
    const allNumbers = Array.from(
        { length: MEGASENA_CONFIG.TOTAL_NUMBERS },
        (_, i) => i + MEGASENA_CONFIG.MIN_NUMBER
    );

    const toggleNumber = (num: number) => {
        if (disabled || fixedNumbers.includes(num)) return;

        const isSelected = selected.includes(num);
        if (isSelected) {
            onChange(selected.filter(n => n !== num));
        } else {
            if (maxSelection && selected.length >= maxSelection) return;
            onChange([...selected, num].sort((a, b) => a - b));
        }
    };

    const selectAll = () => {
        if (disabled) return;
        onChange(allNumbers.filter(n => !fixedNumbers.includes(n)));
    };

    const clearAll = () => {
        if (disabled) return;
        onChange([]);
    };

    const invertSelection = () => {
        if (disabled) return;
        const newSelection = allNumbers.filter(
            n => !selected.includes(n) && !fixedNumbers.includes(n)
        );
        onChange(newSelection);
    };

    const selectRandom = (count: number) => {
        if (disabled) return;
        const available = allNumbers.filter(n => !fixedNumbers.includes(n));
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        onChange(shuffled.slice(0, count).sort((a, b) => a - b));
    };

    const isNumberSelected = (num: number) => {
        return selected.includes(num) || fixedNumbers.includes(num);
    };

    const isNumberFixed = (num: number) => {
        return fixedNumbers.includes(num);
    };

    return (
        <Card className={disabled ? 'opacity-50' : ''}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Grid3x3 className="w-5 h-5" />
                            Seleção de Dezenas
                        </CardTitle>
                        <CardDescription>
                            Selecione as dezenas de 1 a 60 para sua aposta
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                        {selected.length} / {MEGASENA_CONFIG.TOTAL_NUMBERS}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectRandom(10)}
                        disabled={disabled}
                    >
                        <Shuffle className="w-3 h-3 mr-1" />
                        10 Aleatórias
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectRandom(20)}
                        disabled={disabled}
                    >
                        <Shuffle className="w-3 h-3 mr-1" />
                        20 Aleatórias
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectRandom(30)}
                        disabled={disabled}
                    >
                        <Shuffle className="w-3 h-3 mr-1" />
                        30 Aleatórias
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAll}
                        disabled={disabled}
                    >
                        Todas
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={invertSelection}
                        disabled={disabled}
                    >
                        Inverter
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={clearAll}
                        disabled={disabled}
                    >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Limpar
                    </Button>
                </div>

                {/* Grid de Dezenas - 6 linhas x 10 colunas (1-60) */}
                <div className="grid grid-cols-10 gap-1.5">
                    {allNumbers.map(num => {
                        const isSelected = isNumberSelected(num);
                        const isFixed = isNumberFixed(num);

                        return (
                            <button
                                key={num}
                                onClick={() => toggleNumber(num)}
                                disabled={disabled || isFixed}
                                className={`
                                    relative aspect-square rounded-md text-sm font-medium
                                    transition-all duration-150 hover:scale-105
                                    ${isSelected
                                        ? isFixed
                                            ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300'
                                            : 'bg-green-600 text-white shadow-md hover:bg-green-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }
                                    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                {num.toString().padStart(2, '0')}
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1">
                                        {isFixed ? (
                                            <div className="w-3 h-3 bg-orange-400 rounded-full border border-white" />
                                        ) : (
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {fixedNumbers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t">
                        <div className="w-3 h-3 bg-orange-500 rounded-full" />
                        <span>Dezenas fixas ({fixedNumbers.length})</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
