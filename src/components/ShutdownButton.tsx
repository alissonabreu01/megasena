"use client";

import { useState } from "react";
import { Power, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function ShutdownButton() {
    const [isShuttingDown, setIsShuttingDown] = useState(false);
    const { toast } = useToast();

    const handleShutdown = async () => {
        setIsShuttingDown(true);

        try {
            const response = await fetch("/api/shutdown", {
                method: "POST",
            });

            if (response.ok) {
                toast({
                    title: "Servidor Encerrado",
                    description: "O servidor local foi encerrado com sucesso. A porta 3000 foi liberada.",
                });
            }
        } catch {
            // Erro esperado quando o servidor é encerrado antes da resposta completa
            toast({
                title: "Servidor Encerrado",
                description: "O servidor local foi encerrado. A porta 3000 foi liberada.",
            });
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                    title="Encerrar Servidor"
                >
                    <Power className="h-5 w-5" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Power className="h-5 w-5 text-destructive" />
                        Encerrar Servidor Local
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Isso irá encerrar o servidor de desenvolvimento na porta 3000.
                        Você precisará reiniciar o servidor manualmente com{" "}
                        <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
                            npm run dev
                        </code>{" "}
                        para continuar usando a aplicação.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleShutdown}
                        disabled={isShuttingDown}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        <Power className="h-4 w-4 mr-2" />
                        {isShuttingDown ? "Encerrando..." : "Encerrar Servidor"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
