'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { ScoreSystem } from '@/components/ScoreSystem';

export default function ScorePage() {
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Info className="w-8 h-8 text-green-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Sistema de Pontuação</h1>
                    </div>
                    <p className="text-gray-600">
                        Entenda como funciona o sistema de pontuação de qualidade dos jogos da Mega Sena
                    </p>
                </div>

                {/* Overview Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Como Funciona</CardTitle>
                        <CardDescription>
                            Sistema de avaliação baseado em padrões estatísticos da Mega Sena
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="prose max-w-none">
                            <p className="text-gray-700">
                                O sistema de pontuação de qualidade avalia cada jogo com base em critérios
                                estatísticos observados nos sorteios históricos da <strong>Mega Sena</strong>. Cada jogo
                                começa com <strong>100 pontos</strong> e perde pontos conforme se afasta
                                dos padrões mais comuns.
                            </p>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                                <h3 className="text-lg font-semibold text-green-900 mb-2">
                                    📊 Regras da Mega Sena
                                </h3>
                                <ul className="space-y-1 text-sm text-green-800">
                                    <li>• <strong>60 dezenas</strong> disponíveis (1 a 60)</li>
                                    <li>• O apostador escolhe de <strong>6 a 15 números</strong></li>
                                    <li>• São sorteadas <strong>6 dezenas</strong></li>
                                    <li>• Prêmios para <strong>6 (Sena), 5 (Quina) ou 4 (Quadra) acertos</strong></li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                    Interpretação da Pontuação
                                </h3>
                                <ul className="space-y-2 text-sm text-blue-800">
                                    <li>
                                        <strong>90-100 pontos:</strong> Jogo excelente, segue todos os padrões estatísticos
                                    </li>
                                    <li>
                                        <strong>70-89 pontos:</strong> Jogo bom, com pequenos desvios dos padrões
                                    </li>
                                    <li>
                                        <strong>50-69 pontos:</strong> Jogo regular, com alguns desvios significativos
                                    </li>
                                    <li>
                                        <strong>Abaixo de 50:</strong> Jogo com muitos desvios dos padrões comuns
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                                    ⚠️ Importante
                                </h3>
                                <p className="text-sm text-amber-800">
                                    Uma pontuação alta não garante que o jogo será sorteado, mas indica que
                                    ele segue os padrões estatísticos mais frequentes. A Mega Sena é um jogo
                                    de azar e qualquer combinação válida pode ser sorteada.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Score System Component */}
                <ScoreSystem />

                {/* Additional Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dicas para Melhorar a Pontuação</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">•</span>
                                <span>
                                    <strong>Equilíbrio entre pares e ímpares:</strong> Para 6 números, procure ter entre 2 e 4
                                    números pares (proporção 30%-70%)
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">•</span>
                                <span>
                                    <strong>Distribuição no volante:</strong> Espalhe os números pelas
                                    6 linhas e 10 colunas do volante (grid 6x10)
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">•</span>
                                <span>
                                    <strong>Evite sequências longas:</strong> Para jogos de 6 números, mais de 3 números
                                    consecutivos é incomum
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">•</span>
                                <span>
                                    <strong>Soma das dezenas:</strong> Para 6 números, a soma ideal fica entre 90 e 240
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">•</span>
                                <span>
                                    <strong>Amplitude:</strong> A diferença entre o maior e menor número deve ser razoável
                                    (acima de 20 para jogos de 6 números)
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">•</span>
                                <span>
                                    <strong>Moldura:</strong> Números da borda do volante (1-10, 51-60, e extremidades das colunas)
                                    devem representar cerca de 20-55% do jogo
                                </span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
