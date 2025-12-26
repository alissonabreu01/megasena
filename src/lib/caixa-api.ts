import { z } from 'zod';

// Schema para validação da resposta da API da Caixa
const CaixaContestSchema = z.object({
  numero: z.number(),
  dataApuracao: z.string(),
  listaDezenas: z.array(z.string()),
  tipoJogo: z.string().optional(),
  acumulado: z.boolean().optional(),
  valorAcumuladoProximoConcurso: z.number().optional(),
});

const CaixaLatestSchema = z.object({
  numero: z.number(),
  dataApuracao: z.string(),
  listaDezenas: z.array(z.string()),
  tipoJogo: z.string(),
  acumulado: z.boolean(),
  valorAcumuladoProximoConcurso: z.number(),
  dataProximoConcurso: z.string(),
  numeroConcursoAnterior: z.number(),
  valorEstimadoProximoConcurso: z.number()
});

// Schema para validação da resposta da API Guidi (fallback)
const GuidiContestSchema = z.object({
  numero: z.number(),
  dataApuracao: z.string(),
  listaDezenas: z.array(z.string()),
  acumulado: z.boolean(),
  dataProximoConcurso: z.string().nullable(),
  valorAcumuladoProximoConcurso: z.number(),
});

export type CaixaContest = z.infer<typeof CaixaContestSchema>;
export type CaixaLatest = z.infer<typeof CaixaLatestSchema>;
type GuidiContest = z.infer<typeof GuidiContestSchema>;

export class CaixaAPI {
  private static readonly BASE_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
  private static readonly FALLBACK_URL = 'https://api.guidi.dev.br/loteria';
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  private static readonly TIMEOUT = 10000; // 10 segundos
  private static readonly RETRY_ATTEMPTS = 2;
  private static readonly RETRY_DELAY = 1000; // 1 segundo

  private static convertGuidiToCaixaContest(guidiData: GuidiContest): CaixaContest {
    return {
      numero: guidiData.numero,
      dataApuracao: guidiData.dataApuracao,
      listaDezenas: guidiData.listaDezenas,
      acumulado: guidiData.acumulado,
      valorAcumuladoProximoConcurso: guidiData.valorAcumuladoProximoConcurso,
      tipoJogo: 'MEGA_SENA',
    };
  }

  private static convertGuidiToCaixaLatest(guidiData: GuidiContest): CaixaLatest {
    return {
      ...this.convertGuidiToCaixaContest(guidiData),
      tipoJogo: 'MEGA_SENA',
      dataProximoConcurso: guidiData.dataProximoConcurso ?? '',
      numeroConcursoAnterior: guidiData.numero - 1,
      valorEstimadoProximoConcurso: 0, // Fallback API não fornece essa informação
    };
  }

  /**
   * Busca um concurso específico da API da Caixa com fallback
   */
  static async getContest(contestNumber: number): Promise<CaixaContest | null> {
    const primaryResult = await this.getContestFromPrimary(contestNumber);
    if (primaryResult) {
      return primaryResult;
    }

    console.log(`Falha na API da Caixa, tentando fallback para o concurso ${contestNumber}...`);
    const fallbackResult = await this.getContestFromFallback(contestNumber);
    if (fallbackResult) {
      return this.convertGuidiToCaixaContest(fallbackResult);
    }

    console.error(`Todas as fontes falharam para o concurso ${contestNumber}`);
    return null;
  }

  /**
   * Busca o concurso mais recente da API da Caixa com fallback
   */
  static async getLatestContest(): Promise<CaixaLatest | null> {
    const primaryResult = await this.getLatestContestFromPrimary();
    if (primaryResult) {
      return primaryResult;
    }

    console.log('Falha na API da Caixa, tentando fallback para o último concurso...');
    const fallbackResult = await this.getLatestContestFromFallback();
    if (fallbackResult) {
      return this.convertGuidiToCaixaLatest(fallbackResult);
    }

    console.error('Todas as fontes falharam para o último concurso');
    return null;
  }

  private static async getContestFromPrimary(contestNumber: number): Promise<CaixaContest | null> {
    const url = `${this.BASE_URL}/megasena/${contestNumber}`;
    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': this.USER_AGENT, 'Accept': 'application/json' },
          signal: AbortSignal.timeout(this.TIMEOUT)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return CaixaContestSchema.parse(data);
      } catch (error) {
        console.warn(`API da Caixa (tentativa ${attempt}) falhou para concurso ${contestNumber}:`, error);
        if (attempt < this.RETRY_ATTEMPTS) await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    return null;
  }

  private static async getLatestContestFromPrimary(): Promise<CaixaLatest | null> {
    const url = `${this.BASE_URL}/megasena/`;
    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': this.USER_AGENT, 'Accept': 'application/json' },
          signal: AbortSignal.timeout(this.TIMEOUT)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return CaixaLatestSchema.parse(data);
      } catch (error) {
        console.warn(`API da Caixa (tentativa ${attempt}) falhou para o último concurso:`, error);
        if (attempt < this.RETRY_ATTEMPTS) await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    return null;
  }

  private static async getContestFromFallback(contestNumber: number): Promise<GuidiContest | null> {
    const url = `${this.FALLBACK_URL}/megasena/${contestNumber}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(this.TIMEOUT) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return GuidiContestSchema.parse(data);
    } catch (error) {
      console.error(`API Fallback falhou para o concurso ${contestNumber}:`, error);
      return null;
    }
  }

  private static async getLatestContestFromFallback(): Promise<GuidiContest | null> {
    const url = `${this.FALLBACK_URL}/megasena/ultimo`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(this.TIMEOUT) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return GuidiContestSchema.parse(data);
    } catch (error) {
      console.error('API Fallback falhou para o último concurso:', error);
      return null;
    }
  }

  static async getContestsBatch(startContest: number, endContest: number): Promise<CaixaContest[]> {
    const contests: CaixaContest[] = [];
    const batchSize = 10;
    console.log(`Buscando concursos de ${startContest} a ${endContest} em lotes de ${batchSize}`);

    for (let i = startContest; i <= endContest; i += batchSize) {
      const batchEnd = Math.min(i + batchSize - 1, endContest);
      const promises = Array.from({ length: batchEnd - i + 1 }, (_, k) => this.getContest(i + k));

      const results = await Promise.all(promises);
      const validResults = results.filter((result): result is CaixaContest => result !== null);
      contests.push(...validResults);

      console.log(`Lote ${i}-${batchEnd}: ${validResults.length}/${promises.length} concursos obtidos`);
      if (batchEnd < endContest) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    return contests;
  }

  static async checkAPIStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/megasena/`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.warn('API da Caixa indisponível, verificando fallback...');
      try {
        const fallbackResponse = await fetch(`${this.FALLBACK_URL}/megasena/ultimo`, {
          signal: AbortSignal.timeout(5000)
        });
        return fallbackResponse.ok;
      } catch (fallbackError) {
        console.error('Ambas as APIs estão indisponíveis.');
        return false;
      }
    }
  }

  static formatDate(apiDate: string): string {
    if (apiDate.includes('/')) {
      const [day, month, year] = apiDate.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
    }
    // Handle cases where the date might already be in YYYY-MM-DD format
    if (apiDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${apiDate}T00:00:00.000Z`;
    }
    return apiDate;
  }

  static convertToDatabaseFormat(apiData: CaixaContest | CaixaLatest) {
    const dezenas = apiData.listaDezenas;
    return {
      concurso: apiData.numero,
      dataSorteio: this.formatDate(apiData.dataApuracao),
      bola01: parseInt(dezenas[0]),
      bola02: parseInt(dezenas[1]),
      bola03: parseInt(dezenas[2]),
      bola04: parseInt(dezenas[3]),
      bola05: parseInt(dezenas[4]),
      bola06: parseInt(dezenas[5])
    };
  }
}