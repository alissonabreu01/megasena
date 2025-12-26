"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface CycleStats {
  [key: number]: {
    mu: number;
    sd: number;
    currentCycle: number;
    historicalCycles: number[];
    empProbWithin5: number;
    urgencyScore: number;
  };
}

export default function CiclosPage() {
  const [cycleData, setCycleData] = useState<CycleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'urgency' | 'probability' | 'currentCycle' | 'number'>('number');
  const [filter, setFilter] = useState<'all' | 'delayed'>('all');
  const [numGamesToGenerate, setNumGamesToGenerate] = useState(1);
  const [topNUrgency, setTopNUrgency] = useState(15);
  const [minEven, setMinEven] = useState(7);
  const [maxEven, setMaxEven] = useState(8);
  const [minSum, setMinSum] = useState(170);
  const [maxSum, setMaxSum] = useState(220);
  const [generatedCycleGames, setGeneratedCycleGames] = useState<number[][]>([]);

  useEffect(() => {
    const fetchCycleData = async () => {
      try {
        const response = await fetch('/api/ciclos?type=cycleStats');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCycleData(data.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCycleData();
  }, []);

  const generateCycleGames = async () => {
    setLoading(true);
    setGeneratedCycleGames([]);
    try {
      const response = await fetch('/api/generate-cycle-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numGames: numGamesToGenerate,
          topNUrgency,
          filters: {
            minEven,
            maxEven,
            minSum,
            maxSum,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedCycleGames(data.games);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando análise de ciclos...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erro ao carregar dados de ciclos: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!cycleData) {
    return <div className="p-4 text-center">Nenhum dado de ciclo disponível.</div>;
  }

  const sortedAndFilteredData = Object.entries(cycleData)
    .filter(([number, stats]) => {
      if (filter === 'delayed') {
        return stats.currentCycle > stats.mu;
      }
      return true;
    })
    .sort(([numA, statsA], [numB, statsB]) => {
      if (sortOrder === 'urgency') {
        return statsB.urgencyScore - statsA.urgencyScore;
      } else if (sortOrder === 'probability') {
        return statsB.empProbWithin5 - statsA.empProbWithin5;
      } else if (sortOrder === 'currentCycle') {
        return statsB.currentCycle - statsA.currentCycle;
      }
      return parseInt(numA) - parseInt(numB); // Default sort by number
    });

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Análise de Ciclos da Lotofácil</h1>

      <div className="flex gap-4 mb-4">
        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'urgency' | 'probability' | 'currentCycle' | 'number')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Número</SelectItem>
            <SelectItem value="urgency">Urgência</SelectItem>
            <SelectItem value="probability">Probabilidade</SelectItem>
            <SelectItem value="currentCycle">Ciclo Atual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | 'delayed')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="delayed">Atrasadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedAndFilteredData.map(([number, stats]) => (
          <Card key={number} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Dezena {number.padStart(2, '0')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-600">Média Histórica: {stats.mu} concursos</p>
              <p className="text-sm text-gray-600">Desvio Padrão: {stats.sd} concursos</p>
              <p className="text-sm font-semibold mt-2">Ciclo Atual: {stats.currentCycle} concursos</p>
              <p className="text-sm text-gray-600">Prob. Fechar em 5 Concursos: {(stats.empProbWithin5 * 100).toFixed(2)}%</p>
              
              <div className="mt-3">
                <Progress value={(stats.currentCycle / stats.mu) * 100} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {(stats.currentCycle / stats.mu * 100).toFixed(0)}% do ciclo médio
                </p>
              </div>

              {stats.currentCycle > stats.mu && (
                <Badge variant="destructive" className="mt-2">Atrasada</Badge>
              )}
              {stats.currentCycle === 0 && (
                <Badge variant="secondary" className="mt-2">Recém-sorteada</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-3xl font-bold mt-8 mb-6">Gerador de Jogos Baseado em Ciclos</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Gerador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Número de Jogos</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={numGamesToGenerate}
                onChange={(e) => setNumGamesToGenerate(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Usar Top N Dezenas Mais Urgentes</label>
              <Input
                type="number"
                min="15"
                max="25"
                value={topNUrgency}
                onChange={(e) => setTopNUrgency(parseInt(e.target.value) || 15)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mínimo de Pares</label>
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={minEven}
                  onChange={(e) => setMinEven(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Máximo de Pares</label>
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={maxEven}
                  onChange={(e) => setMaxEven(parseInt(e.target.value) || 15)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Soma Mínima</label>
                <Input
                  type="number"
                  min="0"
                  value={minSum}
                  onChange={(e) => setMinSum(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Soma Máxima</label>
                <Input
                  type="number"
                  min="0"
                  value={maxSum}
                  onChange={(e) => setMaxSum(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <Button onClick={generateCycleGames} disabled={loading} className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              Gerar Jogos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jogos Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {generatedCycleGames.length > 0 ? (
                generatedCycleGames.map((game, index) => (
                  <div key={index} className="p-2 border rounded">
                    <div className="font-medium text-sm mb-1">Jogo {index + 1}</div>
                    <div className="flex gap-1 flex-wrap">
                      {game.map(num => (
                        <Badge key={num} variant="outline" className="text-xs">
                          {num.toString().padStart(2, '0')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum jogo gerado ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}