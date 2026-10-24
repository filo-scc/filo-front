// Quantidade que uma linha de parceiro assume no modal de transferência.
// Com um único parceiro, vale sempre o total da ficha. Com vários, vale o que foi registrado
// para a linha: zero e ausência de valor contam como 0, e nunca viram o total da ficha.
export function getEffectiveQuantity(line, totalLines, fichaQuantidade) {
    if (totalLines === 1) return Number(fichaQuantidade || 0);
    return Number(line?.quantidade || 0);
}

// Converte o texto digitado no campo de quantidade em número: só os dígitos contam e vazio vira 0.
export function lerQuantidadeDigitada(texto) {
    const digitos = String(texto ?? "").replace(/\D/g, "");
    return digitos === "" ? 0 : Number(digitos);
}

// Texto exibido no campo: quantidade 0 fica vazia para aparecer o placeholder "0".
export function formatarQuantidadeCampo(quantidade) {
    const numero = Number(quantidade || 0);
    return numero > 0 ? String(numero) : "";
}
