// Quantidade que uma linha de parceiro assume no modal de transferência.
// Com um único parceiro, vale sempre o total da ficha. Com vários, vale o que foi registrado
// para a linha: zero e ausência de valor contam como 0, e nunca viram o total da ficha.
export function getEffectiveQuantity(line, totalLines, fichaQuantidade) {
    if (totalLines === 1) return Number(fichaQuantidade || 0);
    return Number(line?.quantidade || 0);
}
