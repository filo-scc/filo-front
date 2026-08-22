const normalizarNome = (valor) =>
    String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLocaleLowerCase("pt-BR")
        .replace(/\s+/g, " ");

const obterPrecoValido = (vinculo) => {
    if (vinculo?.preco === null || vinculo?.preco === undefined || vinculo?.preco === "") {
        return null;
    }

    const preco = Number(vinculo.preco);
    return Number.isFinite(preco) && preco > 0 ? preco : null;
};

export const calcularCustosMediosDasEtapas = (etapas = [], vinculosParceiroProduto = []) => {
    const etapasAtivasParaCusto = etapas
        .filter((etapa) => etapa?.ativa)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
        .slice(0, -1);

    return etapasAtivasParaCusto.map((etapa) => {
        const nomeEtapa = normalizarNome(etapa.nome);
        const precosDaEtapa = vinculosParceiroProduto
            .filter((vinculo) => normalizarNome(vinculo?.parceiro?.categoria) === nomeEtapa)
            .map(obterPrecoValido)
            .filter((preco) => preco !== null);

        const custoMedio = precosDaEtapa.length
            ? precosDaEtapa.reduce((total, preco) => total + preco, 0) / precosDaEtapa.length
            : 0;

        return {
            ...etapa,
            custo: custoMedio,
        };
    });
};
