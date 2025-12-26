'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Zap, Home, TrendingUp, CheckCircle, Info, Map, Award, Activity, Filter, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Dashboard', icon: Home },
        { href: '/gerador', label: 'Gerador', icon: Zap },
        { href: '/exclusao-dezenas', label: 'Exclusão', icon: Filter },
        { href: '/simulador-fechamento', label: 'Simulador', icon: TestTube },
        { href: '/analises', label: 'Análises', icon: TrendingUp },
        { href: '/mapa-dezenas', label: 'Mapa', icon: Map },
        { href: '/analise-mapa', label: 'Tendências', icon: Activity },
        { href: '/verificador', label: 'Verificador', icon: CheckCircle },
        { href: '/conferidor', label: 'Conferidor', icon: Award },
        { href: '/score', label: 'Score', icon: Info },
    ];

    return (
        <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center h-16 justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-green-700">
                        <BarChart3 className="w-6 h-6" />
                        <span>Mega Sena Analyzer</span>
                    </div>

                    <div className="flex gap-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    prefetch={true}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-green-100 text-green-700"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
