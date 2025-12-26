# Histórico de Alterações - Gemini

### v1.1.0 (17/10/2025)

#### ✨ Novas Funcionalidades

*   **Adicionada Aba de Sistema de Score**: Uma nova aba foi incluída na interface para detalhar o funcionamento do sistema de pontuação de qualidade dos jogos, exibindo todos os critérios, pesos e condições de dedução de pontos.
*   **Filtro de Jogo já Sorteado**: Adicionada uma caixa de seleção no "Verificador de Qualidade" para incluir a verificação de jogos já sorteados como um critério de análise.

#### 🐛 Correções

*   **Correção no Critério "Jogo já Sorteado"**: A lógica foi ajustada para verificar se um jogo é idêntico a qualquer concurso já sorteado em todo o banco de dados, não apenas no último. A pontuação é zerada se a condição for atendida.
*   **Ajuste nos Critérios de Pontuação**: Os pesos e as condições de diversos critérios de análise foram atualizados para refletir com mais precisão as regras de negócio, incluindo "Repetidas do anterior", "Fibonacci", "Pares consecutivos" e "Amplitude".

#### UI (Interface do Usuário)

*   **Exibição de Sequências de Pares**: A análise de pares consecutivos agora exibe as sequências encontradas (ex: "01-02, 10-11"), similar ao que já era feito para trios.
*   **Atualização da Descrição do Score**: A descrição do critério "Jogo já sorteado" na aba de sistema de score foi atualizada para maior clareza.

---
Este documento detalha as correções e melhorias implementadas para resolver instabilidades da API, reparar a funcionalidade de importação de planilhas e aumentar a robustez geral da aplicação.

---

### 1. Resiliência da API de Resultados (Solução de Fallback)

*   **Problema:** A aplicação era fortemente dependente da API da Caixa, que frequentemente ficava indisponível, tornando o sistema inutilizável.
*   **Solução:** Foi implementado um sistema de fallback para uma API secundária.
    *   **Integração:** Adicionamos uma API alternativa e mais estável (`api.guidi.dev.br`) como fonte de dados secundária.
    *   **Lógica de Fallback:** O arquivo `src/lib/caixa-api.ts` foi modificado para que, em caso de falha da API principal da Caixa, o sistema automaticamente tente buscar os dados da API alternativa. Isso garante que a aplicação continue funcional mesmo com a instabilidade da fonte primária.

### 2. Correção da Funcionalidade de Importação de Planilhas

*   **Problema:** A função de importação de dados via planilha não estava implementada. O botão existente não permitia o upload de arquivos.
*   **Solução:** A funcionalidade foi construída do zero.
    *   **Dependência:** A biblioteca `xlsx` foi instalada para permitir a leitura e processamento de arquivos Excel (`.xls`, `.xlsx`).
    *   **Frontend:** O componente `src/components/ImportButton.tsx` foi totalmente refeito para incluir um seletor de arquivos e a lógica para ler os dados da planilha no navegador.
    *   **Backend:** Uma nova rota (`src/app/api/import/route.ts`) foi criada para receber os dados da planilha em formato JSON e salvá-los no banco de dados.

### 3. Robustez na Validação e Processamento de Dados Importados

*   **Problema:** Durante a implementação da importação, surgiram múltiplos erros de validação relacionados a formatos de data, tipos de número e inconsistências com o banco de dados.
*   **Solução:** A API de importação foi aprimorada em etapas para se tornar mais flexível e inteligente.
    *   **Mapeamento de Colunas:** A API agora normaliza os nomes das colunas da planilha, aceitando variações como "Data Sorteio" (com espaço e maiúsculas) e "Bola1" (sem zero à esquerda).
    *   **Conversão de Tipos:** A validação de dados agora converte ativamente valores em texto para seus tipos corretos. Isso inclui números formatados como texto e, crucialmente, datas no formato brasileiro (`DD/MM/AAAA`).
    *   **Correção do Schema do Banco de Dados:** O modelo de dados em `prisma/schema.prisma` foi corrigido. O campo `dataSorteio` foi alterado do tipo `String` para `DateTime`, o que resolveu um erro crítico de incompatibilidade ao salvar os dados.

### 4. Atualização da Interface Pós-Importação

*   **Problema:** Após uma importação bem-sucedida, a lista de concursos na tela não era atualizada automaticamente, forçando o usuário a recarregar a página.
*   **Solução:** O cache de dados na API foi desabilitado.
    *   No arquivo `src/app/api/contests/route.ts`, foi adicionada a linha `export const revalidate = 0;`. Isso força o Next.js a sempre buscar os dados mais recentes do banco de dados, garantindo que a interface reflita imediatamente quaisquer alterações, como uma nova importação.

### 5. Correções e Melhorias na Interface e Análises

*   **Correção de Bug na Análise de Repetidas:**
    *   **Problema:** A análise de dezenas repetidas estava buscando os concursos mais antigos em vez dos mais recentes, resultando em dados incorretos.
    *   **Solução:** No arquivo `src/app/api/analysis/route.ts`, a ordenação da busca no banco de dados foi corrigida de `asc` para `desc`, garantindo que a análise seja feita sempre sobre os últimos concursos.

*   **Melhorias na Interface do Usuário:**
    *   **Redução de Espaço em Branco:** Diminuído o padding e a margem no cabeçalho e no contêiner principal em `src/app/page.tsx` para um layout mais compacto.
    *   **Destaque de Menu Ativo:** Adicionado um indicador visual (borda inferior roxa) ao item de menu ativo para melhorar a navegabilidade.
    *   **Formatação de Datas:** A coluna `dataSorteio` nas tabelas de análise agora é exibida como "Data" e formatada como `DD/MM/YYYY` para melhor legibilidade.

*   **Funcionalidade Adicional na Análise de Ciclos:**
    *   **Problema:** A análise de ciclos não mostrava quais dezenas faltavam para fechar o ciclo atual.
    *   **Solução:** A interface foi atualizada para exibir a lista de números faltantes, o início e o tamanho do ciclo atual, fornecendo uma visão mais completa ao usuário.

---

## Próximos Passos

*   Criação de fechamentos matemáticos.
