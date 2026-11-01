function normalizePreco(preco) {
    if (preco === null || preco === undefined || preco === "") return null;
    const parsed = Number(preco);
    return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeParceiro(item) {
    if (!item) return null;

    if (item.parceiro) {
        return {
            id: item.parceiro.id,
            nome: item.parceiro.nome,
            preco: normalizePreco(item.preco),
            etapa_id: item.parceiro.etapa_id ?? null,
            possuiPedido: Boolean(item.possuiPedido ?? item.parceiro.possuiPedido ?? false),
        };
    }

    return {
        id: item.id,
        nome: item.nome,
        preco: normalizePreco(item.preco),
        etapa_id: item.etapa_id ?? null,
        possuiPedido: Boolean(item.possuiPedido ?? false),
    };
}

// Lista recebida da tela (mesmo vazia) é a verdade: o seletor só busca por conta própria quando
// a tela não passa lista. Senão ele oferece facções que a tela esconde depois.
export function deveBuscarParceiros(parceirosProp) {
    return !Array.isArray(parceirosProp);
}

export function filtrarParceirosDisponiveis(lista = [], idsSelecionados = new Set()) {
    return lista
        .map(normalizeParceiro)
        .filter(Boolean)
        .filter((item) => !idsSelecionados.has(String(item.id)));
}
