export const obterPrecoUnitarioParceiro = (vinculo, produtoId) => {
    const relacoes = vinculo?.parceiro?.parceiro_produto;

    if (!Array.isArray(relacoes) || relacoes.length === 0) {
        return null;
    }

    const relacaoDoProduto = relacoes.find(
        (relacao) => Number(relacao?.produto_id) === Number(produtoId),
    );

    // O detalhe da ficha já retorna parceiro_produto filtrado pelo produto.
    // O fallback para a única relação mantém compatibilidade caso o id não venha serializado.
    const relacao = relacaoDoProduto ?? (relacoes.length === 1 ? relacoes[0] : null);

    return relacao?.preco ?? null;
};
