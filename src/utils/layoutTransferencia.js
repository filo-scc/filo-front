// Iniciais para o avatar do cartão de parceiro (ex.: "Maria Souza" -> "MS").
export function obterIniciais(nome) {
    const palavras = String(nome ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (palavras.length === 0) return "";
    if (palavras.length === 1) return palavras[0].charAt(0).toLocaleUpperCase("pt-BR");

    return (palavras[0].charAt(0) + palavras[palavras.length - 1].charAt(0)).toLocaleUpperCase(
        "pt-BR",
    );
}

// Percentual (0 a 100) da barra "Soma das peças".
export function calcularPercentualSoma(soma, total) {
    const totalNumero = Number(total);
    const somaNumero = Number(soma);

    if (!Number.isFinite(totalNumero) || totalNumero <= 0) return 0;
    if (!Number.isFinite(somaNumero) || somaNumero <= 0) return 0;

    return Math.min(100, Math.round((somaNumero / totalNumero) * 100));
}
