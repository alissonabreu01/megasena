'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface ContestResult {
    contestNumber: number;
    drawnNumbers: number[];
    bestHits: number;
    worstHits: number;
    averageHits: number;
    guaranteeAchieved: boolean;
}

interface SimulationResultsTableProps {
    results: ContestResult[];
    guaranteedHits: number;
}

export function SimulationResultsTable({
    results,
    guaranteedHits,
}: SimulationResultsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all');

    // Filtrar resultados
    const filteredResults = results.filter(result => {
        if (filter === 'success') return result.guaranteeAchieved;
        if (filter === 'failure') return !result.guaranteeAchieved;
        return true;
    });

    // Paginação
    const totalPages = Math.ceil(filteredResults.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    // Exportar para CSV
    const handleExportCSV = () => {
        const headers = ['Concurso', 'Melhor', 'Pior', 'Média', 'Garantia Cumprida'];
        const rows = results.map(r => [
            r.contestNumber,
            r.bestHits,
            r.worstHits,
            r.averageHits.toFixed(2),
            r.guaranteeAchieved ? 'Sim' : 'Não',
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `simulacao_fechamento_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            {/* Filtros e Ações */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os resultados</SelectItem>
                            <SelectItem value="success">Apenas sucessos</SelectItem>
                            <SelectItem value="failure">Apenas falhas</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={pageSize.toString()}
                        onValueChange={v => {
                            setPageSize(Number(v));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 por página</SelectItem>
                            <SelectItem value="25">25 por página</SelectItem>
                            <SelectItem value="50">50 por página</SelectItem>
                            <SelectItem value="100">100 por página</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={handleExportCSV} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                </Button>
            </div>

            {/* Tabela */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Concurso</TableHead>
                            <TableHead className="text-center">Melhor</TableHead>
                            <TableHead className="text-center">Pior</TableHead>
                            <TableHead className="text-center">Média</TableHead>
                            <TableHead className="text-center">Garantia</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedResults.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                    Nenhum resultado encontrado
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedResults.map(result => (
                                <TableRow key={result.contestNumber}>
                                    <TableCell className="font-medium">
                                        #{result.contestNumber}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                result.bestHits >= guaranteedHits
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className={
                                                result.bestHits >= guaranteedHits
                                                    ? 'bg-green-600'
                                                    : ''
                                            }
                                        >
                                            {result.bestHits}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{result.worstHits}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {result.averageHits.toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {result.guaranteeAchieved ? (
                                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredResults.length)} de{' '}
                        {filteredResults.length} resultados
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
