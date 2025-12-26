import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const scoreCriteria = [
  { criterion: "Sequência máxima", points: "-25", condition: "4+ números em sequência (para 6 números)" },
  { criterion: "Pares e ímpares", points: "-20", condition: "Fora da proporção ideal (30%-70% do total)" },
  { criterion: "Soma das dezenas", points: "-20", condition: "Fora da faixa típica (50%-130% da média)" },
  { criterion: "Moldura/Centro", points: "-15", condition: "Fora da proporção ideal (20%-55% na moldura)" },
  { criterion: "Números primos", points: "-12", condition: "Fora da proporção ideal (15%-45% de primos)" },
  { criterion: "Fibonacci", points: "-8", condition: "Mais de 30% de números Fibonacci" },
  { criterion: "Linhas (grid 6x10)", points: "-8", condition: "Linha com mais de 3 dezenas" },
  { criterion: "Colunas/Terminações", points: "-8", condition: "Coluna com mais de 2 dezenas" },
  { criterion: "Amplitude", points: "-10", condition: "Amplitude menor que 35% do range" },
];

export function ScoreSystem() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sistema de Pontuação de Qualidade</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          A pontuação de qualidade de um jogo começa em 100 e diminui com base em
          critérios estatísticos. Quanto maior a pontuação, mais o jogo adere
          aos padrões comuns da <strong>Mega Sena</strong>.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-800">
            <strong>Mega Sena:</strong> 60 dezenas (1-60) • Você escolhe <strong>6 a 15 números</strong> • São sorteadas <strong>6 dezenas</strong>
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Critério</TableHead>
              <TableHead>Pontos Deduzidos</TableHead>
              <TableHead>Condição de Dedução</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scoreCriteria.map((item) => (
              <TableRow key={item.criterion}>
                <TableCell>{item.criterion}</TableCell>
                <TableCell>{item.points}</TableCell>
                <TableCell>{item.condition}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}