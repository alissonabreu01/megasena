import { NextResponse } from "next/server";

export async function POST() {
    // Retorna uma resposta antes de encerrar, para que o cliente receba confirmação
    const response = NextResponse.json({
        success: true,
        message: "Servidor sendo encerrado..."
    });

    // Agenda o encerramento para depois que a resposta for enviada
    setTimeout(() => {
        console.log("🛑 Servidor encerrado via botão de shutdown");
        process.exit(0);
    }, 500);

    return response;
}
