# Mega Sena Analyzer

Este projeto é uma aplicação web desenvolvida para análise estatística e geração de jogos para a **Mega Sena**. Ele oferece ferramentas avançadas para estudar padrões, verificar jogos e gerar palpites baseados em estatísticas históricas.

## Funcionalidades Principais

### 📊 Análises Estatísticas (`/analises`)
Visualize dados detalhados sobre os concursos passados:
- **Frequência das Dezenas**: Gráficos mostrando as dezenas mais e menos sorteadas.
- **Padrões de Paridade**: Distribuição de números pares e ímpares.
- **Soma das Dezenas**: Análise da soma total das dezenas sorteadas.
- **Moldura**: Estatísticas sobre números sorteados na borda do volante (6x10).

### 🎲 Gerador de Jogos (`/gerador`)
Crie jogos otimizados com base em filtros inteligentes:
- **Filtros Estatísticos**: Configure intervalos para soma, pares/ímpares e moldura.
- **Sugestão Automática**: O sistema sugere configurações ideais baseadas nos últimos concursos.
- **Geração em Lote**: Gere múltiplos jogos de uma vez.

### ✅ Conferidor (`/conferidor`)
Verifique seus jogos contra resultados oficiais:
- **Upload de Arquivo**: Suporte para conferir jogos a partir de arquivos de texto.
- **Resultados Detalhados**: Veja se acertou a quadra (4 números), quina (5 números) ou sena (6 números).
- **Resumo Financeiro**: Visualize ganhos, custos e retorno sobre investimento.

### 🗺️ Mapa de Dezenas (`/mapa-dezenas`)
Uma visualização térmica ou espacial das dezenas sorteadas para identificar tendências visuais.

## Tecnologias Utilizadas

- **Frontend**: [Next.js](https://nextjs.org/) (React), [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/).
- **Gráficos**: [Recharts](https://recharts.org/).
- **Backend**: Next.js API Routes.
- **Banco de Dados**: SQLite com [Prisma ORM](https://www.prisma.io/).
- **Linguagem**: TypeScript.

## Como Rodar o Projeto

1.  **Instale as dependências**:
    ```bash
    npm install
    ```

2.  **Configure o Banco de Dados**:
    Certifique-se de que o arquivo `.env` está configurado corretamente com a URL do banco de dados.
    ```bash
    npx prisma generate
    npx prisma db push
    ```

3.  **Inicie o Servidor de Desenvolvimento**:
    ```bash
    npm run dev
    ```

4.  **Acesse a Aplicação**:
    Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Estrutura do Projeto

- `src/app`: Páginas e rotas da aplicação.
- `src/components`: Componentes UI reutilizáveis.
- `src/lib`: Funções utilitárias e lógica de negócios (análises, gerador, etc.).
- `prisma`: Esquema do banco de dados e migrações.

## Contribuição

Sinta-se à vontade para abrir issues ou enviar pull requests para melhorias.