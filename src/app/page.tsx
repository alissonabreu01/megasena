'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  Download,
  AlertCircle,
  Search,
  Target,
  Trophy,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { ImportButton } from '@/components/ImportButton';
import { APITestButton } from '@/components/APITestButton';
import { formatDateForDisplay } from '@/lib/utils';

interface Contest {
  id: number;
  concurso: number;
  dataSorteio: string;
  bola01: number;
  bola02: number;
  bola03: number;
  bola04: number;
  bola05: number;
  bola06: number;
  bola07: number;
  bola08: number;
  bola09: number;
  bola10: number;
  bola11: number;
  bola12: number;
  bola13: number;
  bola14: number;
  bola15: number;
  bola16: number;
  bola17: number;
  bola18: number;
  bola19: number;
  bola20: number;
}

export default function Home() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [apiStatus, setApiStatus] = useState<{ available: boolean; message: string } | null>(null);
  const [updateProgress, setUpdateProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [latestContestDetails, setLatestContestDetails] = useState<any>(null);



  useEffect(() => {
    fetchContests();
    checkAPIStatus();
    fetchLatestContestDetails();
  }, []);

  const fetchLatestContestDetails = async () => {
    try {
      const response = await fetch('/api/latest-contest');
      const data = await response.json();
      if (response.ok) {
        setLatestContestDetails(data);
      }
    } catch (error) {
      console.error('Error fetching latest contest details:', error);
    }
  };

  const checkAPIStatus = async () => {
    try {
      const response = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkAPIStatus' })
      });

      const data = await response.json();
      setApiStatus(data);
    } catch (error) {
      setApiStatus({ available: false, message: 'Erro ao verificar status da API' });
    }
  };

  const fetchContests = async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '10');
      if (search) params.append('search', search);

      const response = await fetch(`/api/contests?${params}`);
      const data = await response.json();

      if (response.ok) {
        setContests(data.contests);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch contests' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const updateFromAPI = async () => {
    if (!apiStatus?.available) {
      setMessage({ type: 'error', text: 'API da Caixa está indisponível no momento' });
      return;
    }

    setLoading(true);
    setUpdateProgress({ current: 0, total: 0, status: 'Verificando status da API...' });

    try {
      const response = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateFromAPI' })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `${data.message} (Último: ${data.latestContest})`
        });

        if (data.hasMore) {
          setMessage({
            type: 'info',
            text: `${data.message} - Clique novamente para importar mais concursos`
          });
        }

        fetchContests();
        checkAPIStatus(); // Verificar status novamente
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update from API' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
      setUpdateProgress(null);
    }
  };



  const renderLotteryTicket = (contest: Contest) => {
    const numbers: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const num = contest[`bola${i.toString().padStart(2, '0')}` as keyof Contest] as number;
      if (num !== undefined && num !== null) {
        numbers.push(num);
      }
    }

    // Grid 6x10 da Mega Sena  (números 1-60)
    return (
      <div className="grid grid-cols-10 gap-1 max-w-2xl mx-auto">
        {Array.from({ length: 60 }, (_, i) => i + 1).map(num => (
          <div
            key={num}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${numbers.includes(num)
              ? 'bg-green-200 text-green-800 border-2 border-green-400'
              : 'bg-white text-green-600 border border-green-200'
              }`}
          >
            {num.toString().padStart(2, '0')}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mega Sena Analyzer</h1>
              <p className="text-gray-600 mt-1">Análise estatística e geração de jogos</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={updateFromAPI} disabled={loading || !apiStatus?.available}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <ImportButton onImportComplete={fetchContests} />
              <APITestButton onTestComplete={(result) => {
                if (result?.success) {
                  checkAPIStatus();
                  fetchContests();
                }
              }} />
            </div>
          </div>

          {/* API Status */}
          {apiStatus && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${apiStatus.available
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
              }`}>
              <div className={`w-2 h-2 rounded-full ${apiStatus.available ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm ${apiStatus.available ? 'text-green-800' : 'text-red-800'}`}>
                API Caixa: {apiStatus.message}
              </span>
              {!apiStatus.available && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkAPIStatus}
                  className="ml-auto"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Verificar
                </Button>
              )}
            </div>
          )}

          {/* Update Progress */}
          {updateProgress && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-800">{updateProgress.status}</span>
                <span className="text-sm text-blue-600">
                  {updateProgress.current > 0 && `${updateProgress.current}/${updateProgress.total}`}
                </span>
              </div>
              <Progress value={updateProgress.total > 0 ? (updateProgress.current / updateProgress.total) * 100 : 0} />
            </div>
          )}
        </div>

        {/* Message Alert */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' :
            message.type === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Latest Contest Details - Prêmios e Próximo Concurso */}
        {latestContestDetails && !latestContestDetails.fromCache && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Prêmios do Último Concurso */}
            {latestContestDetails.prizes && latestContestDetails.prizes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    Premiação - Concurso {latestContestDetails.contest.number}
                  </CardTitle>
                  <CardDescription>
                    Distribuição de prêmios por faixa de acertos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {latestContestDetails.prizes.map((prize: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${prize.hits === 20 ? 'bg-yellow-100 text-yellow-700' :
                            prize.hits === 19 ? 'bg-gray-100 text-gray-700' :
                              prize.hits === 18 ? 'bg-orange-100 text-orange-700' :
                                prize.hits === 17 ? 'bg-blue-100 text-blue-700' :
                                  prize.hits === 16 ? 'bg-green-100 text-green-700' :
                                    prize.hits === 15 ? 'bg-purple-100 text-purple-700' :
                                      prize.hits === 0 ? 'bg-pink-100 text-pink-700' :
                                        'bg-gray-50 text-gray-500'
                            }`}>
                            {prize.hits}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">
                              {prize.description || `${prize.hits} acertos`}
                            </div>
                            <div className="text-xs text-gray-600">
                              {prize.winners} {prize.winners === 1 ? 'ganhador' : 'ganhadores'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            R$ {prize.prizeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Próximo Concurso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Próximo Concurso
                </CardTitle>
                <CardDescription>
                  Informações sobre o próximo sorteio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestContestDetails.nextContest.date && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Data do Sorteio</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {(() => {
                        const dateStr = latestContestDetails.nextContest.date;
                        // Se a data vem no formato DD/MM/YYYY, converte para Date
                        let date;
                        if (dateStr.includes('/')) {
                          const [day, month, year] = dateStr.split('/');
                          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        } else {
                          date = new Date(dateStr);
                        }

                        return date.toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      })()}
                    </div>
                  </div>
                )}

                {latestContestDetails.nextContest.estimatedPrize > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Prêmio Estimado</span>
                    </div>
                    <div className="text-3xl font-bold text-green-700">
                      R$ {latestContestDetails.nextContest.estimatedPrize.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                )}

                {latestContestDetails.accumulated && latestContestDetails.nextContest.accumulatedPrize > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-700 uppercase">⚠️ Acumulado</span>
                      <span className="text-sm text-red-900">
                        + R$ {latestContestDetails.nextContest.accumulatedPrize.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {!latestContestDetails.nextContest.date && !latestContestDetails.nextContest.estimatedPrize && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Informações do próximo concurso ainda não disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Latest Contest */}
        {contests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Último Concurso: {contests[0].concurso}
              </CardTitle>
              <CardDescription>{formatDateForDisplay(contests[0].dataSorteio)}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderLotteryTicket(contests[0])}
            </CardContent>
          </Card>
        )}

        {/* Concursos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Concursos Recentes</CardTitle>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por número ou data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchContests(searchQuery)}
                />
              </div>
              <Button onClick={() => fetchContests(searchQuery)}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concurso</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Dezenas</TableHead>
                  <TableHead>Pares</TableHead>
                  <TableHead>Ímpares</TableHead>
                  <TableHead>Soma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contests.map((contest) => {
                  const numbers: number[] = [];
                  let evenCount = 0;
                  let sum = 0;

                  for (let i = 1; i <= 6; i++) {
                    const num = contest[`bola${i.toString().padStart(2, '0')}` as keyof Contest] as number;
                    if (num !== undefined && num !== null) {
                      numbers.push(num);
                      if (num % 2 === 0) evenCount++;
                      sum += num;
                    }
                  }

                  const oddCount = numbers.length - evenCount;

                  return (
                    <TableRow key={contest.id}>
                      <TableCell className="font-medium">{contest.concurso}</TableCell>
                      <TableCell>{formatDateForDisplay(contest.dataSorteio)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {numbers.map(n => (
                            <Badge key={n} variant="secondary" className="text-xs">
                              {n.toString().padStart(2, '0')}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{evenCount}</TableCell>
                      <TableCell>{oddCount}</TableCell>
                      <TableCell>{sum}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
