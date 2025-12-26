'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

interface APITestButtonProps {
  onTestComplete?: (result: any) => void;
}

export function APITestButton({ onTestComplete }: APITestButtonProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testAPI = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test 1: Check API Status
      const statusResponse = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkAPIStatus' })
      });
      
      const statusData = await statusResponse.json();
      
      if (!statusData.available) {
        setResult({
          success: false,
          message: 'API da Caixa está indisponível',
          details: statusData
        });
        onTestComplete?.(result);
        return;
      }

      // Test 2: Try to fetch latest contest
      const updateResponse = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateFromAPI' })
      });
      
      const updateData = await updateResponse.json();
      
      setResult({
        success: updateResponse.ok,
        message: updateData.message || updateData.error,
        details: updateData,
        apiStatus: statusData
      });

      onTestComplete?.(result);

    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao testar API',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Testar API da Caixa
        </CardTitle>
        <CardDescription>
          Verifique a conexão com a API oficial da Caixa Econômica Federal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testAPI} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Testar Conexão
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Sucesso
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <Badge variant="destructive">
                    Falha
                  </Badge>
                </>
              )}
            </div>

            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>

            {result.details && (
              <div className="text-sm space-y-2">
                {result.details.latestContest && (
                  <div>
                    <strong>Último concurso:</strong> {result.details.latestContest}
                  </div>
                )}
                {result.details.newContests !== undefined && (
                  <div>
                    <strong>Novos concursos:</strong> {result.details.newContests}
                  </div>
                )}
                {result.details.hasMore && (
                  <div>
                    <strong>Mais concursos disponíveis:</strong> Sim
                  </div>
                )}
                {result.apiStatus && (
                  <div>
                    <strong>Status API:</strong> {result.apiStatus.available ? 'Online' : 'Offline'}
                  </div>
                )}
              </div>
            )}

            {result.error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <strong>Erro:</strong> {result.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}